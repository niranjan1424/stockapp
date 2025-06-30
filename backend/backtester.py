import pandas as pd
from typing import List, Dict

def backtest_strategy(df: pd.DataFrame, holding_days: int = 10, min_score: float = 4.5, stop_loss_pct: float = 5, take_profit_pct: float = 10) -> List[Dict]:
    results = []
    df = df.copy()
    df = df.dropna()

    # Validate inputs
    if len(df) < holding_days:
        print(f"⚠ DataFrame too short for backtesting (length={len(df)}, required={holding_days})")
        return []
    if not all(col in df.columns for col in ['Close', 'Score']):
        print("⚠ DataFrame missing required columns: 'Close' or 'Score'")
        return []
    if not isinstance(df.index, pd.DatetimeIndex):
        print("⚠ DataFrame index is not a DatetimeIndex")
        return []

    for i in range(len(df) - holding_days):
        row = df.iloc[i]

        if row['Score'] >= min_score:
            buy_date = df.index[i]
            buy_price = row['Close']
            max_hold_price = buy_price * (1 + take_profit_pct / 100)
            min_hold_price = buy_price * (1 - stop_loss_pct / 100)

            # Simulate next holding_days
            sell_price = df.iloc[i + holding_days]['Close']
            for j in range(1, holding_days + 1):
                day_price = df.iloc[i + j]['Close']
                if day_price >= max_hold_price:
                    sell_price = max_hold_price
                    break
                elif day_price <= min_hold_price:
                    sell_price = min_hold_price
                    break

            return_pct = ((sell_price - buy_price) / buy_price) * 100

            results.append({
                'Buy Date': buy_date.strftime('%Y-%m-%d'),
                'Buy Price': round(buy_price, 2),
                'Sell Price': round(sell_price, 2),
                'Return (%)': round(return_pct, 2)
            })

    return results