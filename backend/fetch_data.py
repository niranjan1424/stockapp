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

async def analyze_stock(ticker: str) -> Dict[str, Any]:
    try:
        print("📥 Downloading data from yfinance...")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=730)
        data = yf.download(ticker, start=start_date, end=end_date, progress=False, auto_adjust=False, timeout=30)
        print("✅ Data downloaded")

        if not isinstance(data, pd.DataFrame) or data.empty:
            return {"error": "❌ Failed to fetch stock data"}

        if isinstance(data.columns, pd.MultiIndex):
            print(f"MultiIndex detected, flattening columns for ticker: {ticker}")
            data.columns = [col[0] for col in data.columns]
        else:
            print("Single-level columns detected")

        if 'Close' not in data.columns or 'Volume' not in data.columns:
            print("❌ Missing required columns in data:", data.columns)
            return {"error": "❌ Data missing required columns: 'Close' or 'Volume'"}

        print("📊 Applying indicators...")
        data = add_moving_averages(data)
        data = add_rsi(data)
        data = add_bollinger_bands(data)
        data = add_volume_spike(data)
        data = add_support_resistance(data)
        data = add_atr(data)
        print("✅ Indicators applied")

        data = data.dropna().copy()
        if 'Close' not in data.columns:
            return {"error": "❌ 'Close' column missing after indicator processing"}

        if data.empty:
            return {"error": "❌ No valid data after applying indicators"}

        print("📈 Generating scores...")
        data['Score'] = data.apply(generate_score, axis=1)
        print("✅ Scores generated")

        data['Lagged_Return'] = data['Close'].pct_change().shift(1)
        data['Volatility'] = data['Close'].rolling(window=20).std()
        print("✅ Features engineered")

        print("🧠 Training ML model...")
        features = data[['RSI', 'MA20', 'MA50', 'Lagged_Return', 'Volatility', 'Score', 'ATR']].dropna()
        if len(features) < 10:
            return {"error": "❌ Insufficient data for model training"}
        model, mse = train_ml_model(data)
        print("✅ Model trained")

        print("🔁 Running backtest...")
        backtest = backtest_strategy(data)
        print("✅ Backtest complete")

        print("📰 Fetching news...")
        headlines = get_latest_headlines(ticker)
        sentiment_score = 0
        if headlines and isinstance(headlines, list):
            try:
                sentiment_score = sum(h.get('sentiment', 0) for h in headlines) / len(headlines)
            except (TypeError, KeyError) as e:
                print(f"Error calculating sentiment: {e}")
        print("✅ News fetched, Sentiment Score:", sentiment_score)

        latest_data = data.tail(365).reset_index()
        latest = latest_data.iloc[-1]

        predicted_price = None
        if model is not None and hasattr(model, 'predict'):
            try:
                feature_values = [
                    float(latest.get('MA20', 0)),
                    float(latest.get('MA50', 0)),
                    float(latest.get('RSI', 0)),
                    float(latest.get('BB_upper', 0)),
                    float(latest.get('BB_lower', 0)),
                    float(latest.get('ATR', 0)),
                    float(latest.get('Score', 0))
                ]
                feature_array = np.array([feature_values])
                predicted_price = model.predict(feature_array)[0]
                print(f"📈 Predicted 10-day future price: {predicted_price}")
            except Exception as e:
                print(f"Prediction error: {e}")

        trade_action = None
        if predicted_price and 'Close' in latest:
            if predicted_price > latest['Close'] * 1.05 and latest['Close'] < latest.get('BB_upper', float('inf')):
                trade_action = "buy"
            elif predicted_price < latest['Close'] * 0.95 and latest['Close'] > latest.get('BB_lower', 0):
                trade_action = "sell"

        return {
            "ticker": ticker.upper(),
            "mse": round(mse, 2),
            "data": latest_data[[
                'Date', 'Close', 'MA20', 'MA50', 'RSI', 'BB_upper', 'BB_lower',
                'Volume_Spike', 'Support', 'Resistance', 'ATR', 'Score'
            ]].fillna(0).to_dict(orient='records'),
            "top_signals": data.nlargest(5, 'Score')[['Close', 'Score']].reset_index().to_dict(orient='records'),
            "backtest": backtest[-5:] if backtest else [],
            "sentiment": sentiment_score,
            "predicted_price": round(float(predicted_price), 2) if predicted_price is not None else None,
            "trade_action": trade_action
        }

    except Exception as e:
        print(f"🔥 Critical error in analyze_stock: {str(e)}")
        return {"error": f"⚠ System Error: {str(e)}"}
