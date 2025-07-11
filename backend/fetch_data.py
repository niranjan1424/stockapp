import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any
from indicators import (
    add_moving_averages,
    add_rsi,
    add_bollinger_bands,
    add_volume_spike,
    add_support_resistance,
    add_atr
)
from scoring import generate_score
from backtester import backtest_strategy
from ml_model import train_ml_model
from news_helper import get_latest_headlines
import pytz
import logging
from functools import lru_cache

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Define timezone at the top level
ist = pytz.timezone('Asia/Kolkata')

# Cache news headlines to reduce API calls
@lru_cache(maxsize=128)
def cached_headlines(ticker):
    return get_latest_headlines(ticker)

async def fetch_base_data(ticker: str, days: int = 365) -> pd.DataFrame:
    try:
        end_date = datetime.now(ist)
        start_date = end_date - timedelta(days=days)

        logging.info(f"📥 Downloading data for {ticker} from {start_date} to {end_date}")
        stock = yf.Ticker(ticker)  # Re-instantiate to avoid stale cache
        data = stock.history(start=start_date.strftime('%Y-%m-%d'), 
                           end=end_date.strftime('%Y-%m-%d'), 
                           interval='1d', 
                           progress=False, 
                           auto_adjust=False, 
                           timeout=30)

        if data.empty:
            logging.error(f"❌ No daily data for {ticker}")
            return pd.DataFrame()

        # Flatten MultiIndex if present
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = [col[0] for col in data.columns]
            logging.info("✅ Flattened MultiIndex columns")

        # Attempt intraday data for after-hours prices
        logging.info("🎯 Attempting intraday data for after-hours...")
        intraday_data = yf.Ticker(ticker).history(period="1d", interval="5m", prepost=True)
        if not intraday_data.empty:
            data = pd.concat([data, intraday_data]).sort_index().drop_duplicates()
            logging.info("✅ Intraday/after-hours data added")

        return data

    except Exception as e:
        logging.error(f"🔥 Error fetching base data: {str(e)}")
        return pd.DataFrame()

async def analyze_stock(ticker: str, days: int = 90) -> Dict[str, Any]:
    try:
        data = await fetch_base_data(ticker, days)
        if data.empty:
            return {"error": "❌ Failed to fetch stock data"}

        if 'Close' not in data.columns or 'Volume' not in data.columns:
            logging.error(f"❌ Missing required columns in data: {data.columns}")
            return {"error": "❌ Data missing required columns: 'Close' or 'Volume'"}

        # Process recent data for indicators
        recent_data = data.tail(days).copy()
        logging.info("📊 Applying indicators to recent data...")
        recent_data = add_moving_averages(recent_data)
        recent_data = add_rsi(recent_data)
        recent_data = add_bollinger_bands(recent_data)
        recent_data = add_volume_spike(recent_data)
        recent_data = add_support_resistance(recent_data)
        recent_data = add_atr(recent_data)
        recent_data = recent_data.dropna()

        if recent_data.empty or 'Close' not in recent_data.columns:
            return {"error": "❌ No valid data after indicator processing"}

        logging.info("📈 Generating scores...")
        recent_data['Score'] = recent_data.apply(generate_score, axis=1)

        logging.info("🧠 Training ML model on recent data...")
        features = recent_data[['RSI', 'MA20', 'MA50', 'ATR', 'Score']].dropna()
        if len(features) < 10:
            return {"error": "❌ Insufficient data for model training"}
        model, mse = train_ml_model(recent_data)
        logging.info("✅ Model trained")

        logging.info("🔁 Running backtest on recent data...")
        backtest = backtest_strategy(recent_data)
        logging.info("✅ Backtest complete")

        logging.info("📰 Fetching news...")
        headlines = cached_headlines(ticker)
        sentiment_score = sum(h.get('sentiment', 0) for h in headlines) / len(headlines) if headlines else 0
        logging.info(f"✅ News fetched, Sentiment Score: {sentiment_score}")

        latest = recent_data.iloc[-1]
        predicted_price = None
        if model and hasattr(model, 'predict'):
            try:
                feature_values = [latest.get('MA20', 0), latest.get('MA50', 0), latest.get('RSI', 0), latest.get('ATR', 0), latest.get('Score', 0)]
                feature_array = np.array([feature_values])
                predicted_price = model.predict(feature_array)[0]
                logging.info(f"📈 Predicted 10-day future price: {predicted_price}")
            except Exception as e:
                logging.error(f"Prediction error: {e}")

        trade_action = None
        if predicted_price and latest['Close']:
            if predicted_price > latest['Close'] * 1.05 and latest['Close'] < latest.get('BB_upper', float('inf')):
                trade_action = "buy"
            elif predicted_price < latest['Close'] * 0.95 and latest['Close'] > latest.get('BB_lower', 0):
                trade_action = "sell"

        return {
            "ticker": ticker.upper(),
            "data": recent_data[['Date', 'Close', 'MA20', 'MA50', 'RSI', 'BB_upper', 'BB_lower', 'Volume', 'Score', 'Support', 'Resistance', 'ATR']].fillna(0).to_dict(orient='records'),
            "top_signals": recent_data.nlargest(5, 'Score')[['Date', 'Close', 'Score']].reset_index().to_dict(orient='records'),
            "backtest": backtest[-5:] if backtest else [],
            "sentiment": sentiment_score,
            "predicted_price": round(float(predicted_price), 2) if predicted_price else None,
            "trade_action": trade_action
        }

    except Exception as e:
        logging.error(f"🔥 Critical error in analyze_stock: {str(e)}")
        return {"error": f"⚠ System Error: {str(e)}"}

async def get_latest_price(ticker: str) -> Dict[str, Any]:
    try:
        stock = yf.Ticker(ticker)  # Re-instantiate to avoid stale cache
        info = stock.info
        latest_price = info.get('currentPrice', info.get('regularMarketPrice', None))
        latest_time = info.get('regularMarketTime', None)

        # Fallback to historical data if real-time is unavailable
        if not latest_price or not latest_time:
            data = stock.history(period="1d", interval="1d")
            if not data.empty:
                latest_price = data['Close'].iloc[-1]
                latest_time = data.index[-1].timestamp()
                logging.info(f"🎯 Fallback to historical close: ${latest_price} at {datetime.fromtimestamp(latest_time, ist)}")

        # Attempt intraday data for after-hours
        intraday_data = yf.Ticker(ticker).history(period="1d", interval="5m", prepost=True)
        if not intraday_data.empty and intraday_data.index[-1].timestamp() > (latest_time or 0):
            latest_price = intraday_data['Close'].iloc[-1]
            latest_time = intraday_data.index[-1].timestamp()
            logging.info(f"🎯 Updated with intraday: ${latest_price} at {datetime.fromtimestamp(latest_time, ist)}")

        return {
            "latest_price": latest_price,
            "latest_time": datetime.fromtimestamp(latest_time, ist).strftime('%Y-%m-%d %H:%M:%S') if latest_time else None
        }
    except Exception as e:
        logging.error(f"🔥 Error fetching latest price: {str(e)}")
        return {"error": f"⚠ System Error: {str(e)}"}