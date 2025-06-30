import numpy as np
import pandas as pd
from typing import Tuple

def add_moving_averages(df: pd.DataFrame, short_window: int = 20, long_window: int = 50) -> pd.DataFrame:
    df = df.copy()
    if 'Close' not in df.columns:
        raise ValueError("DataFrame missing 'Close' column")
    df['MA20'] = df['Close'].rolling(window=short_window, min_periods=1).mean().ffill()
    df['MA50'] = df['Close'].rolling(window=long_window, min_periods=1).mean().ffill()
    return df

def add_rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    df = df.copy()
    if 'Close' not in df.columns:
        raise ValueError("DataFrame missing 'Close' column")
    print(f"add_rsi: Close type: {df['Close'].dtype}")
    print(f"add_rsi: Close sample: {df['Close'].head().to_list()}")
    print(f"add_rsi: Close NaN count: {df['Close'].isna().sum()}")
    close = pd.to_numeric(df['Close'], errors='coerce')
    if close.isna().all():
        raise ValueError("Close column contains no valid numeric data")
    delta = close.diff().fillna(0)
    delta = delta.astype(float)
    gain = delta.clip(lower=0)
    loss = delta.clip(upper=0).abs()
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    df['RSI'] = rsi.fillna(50)
    return df

def add_bollinger_bands(df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
    df = df.copy()
    if 'Close' not in df.columns:
        raise ValueError("DataFrame missing 'Close' column")
    rolling_mean = df['Close'].rolling(window, min_periods=1).mean()
    rolling_std = df['Close'].rolling(window, min_periods=1).std()
    df['BB_upper'] = rolling_mean + (2 * rolling_std.fillna(0))
    df['BB_lower'] = rolling_mean - (2 * rolling_std.fillna(0))
    return df

def add_volume_spike(df: pd.DataFrame, spike_multiplier: float = 1.5) -> pd.DataFrame:
    df = df.copy()
    if 'Volume' not in df.columns:
        raise ValueError("DataFrame missing 'Volume' column")
    df['Volume'] = pd.to_numeric(df['Volume'], errors='coerce')
    avg_volume = df['Volume'].rolling(20, min_periods=1).mean()
    df['Volume_Spike'] = (df['Volume'] > (avg_volume * spike_multiplier)).astype(int)
    return df

def add_support_resistance(df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
    df = df.copy()
    if 'Close' not in df.columns:
        raise ValueError("DataFrame missing 'Close' column")
    df['Support'] = df['Close'].rolling(window, min_periods=1).min()
    df['Resistance'] = df['Close'].rolling(window, min_periods=1).max()
    return df

def add_atr(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    df = df.copy()
    if 'High' not in df.columns or 'Low' not in df.columns or 'Close' not in df.columns:
        raise ValueError("DataFrame missing 'High', 'Low', or 'Close' column")
    high = pd.to_numeric(df['High'], errors='coerce')
    low = pd.to_numeric(df['Low'], errors='coerce')
    close = pd.to_numeric(df['Close'], errors='coerce')
    if high.isna().all() or low.isna().all() or close.isna().all():
        raise ValueError("High, Low, or Close contains no valid numeric data")
    prev_close = close.shift(1).fillna(close[0])
    true_range = pd.concat([high - low, (high - prev_close).abs(), (low - prev_close).abs()], axis=1).max(axis=1)
    df['ATR'] = true_range.rolling(window=period, min_periods=1).mean().fillna(0)
    return df

def align_dataframes(*dfs: pd.DataFrame) -> Tuple[pd.DataFrame, ...]:
    aligned = []
    for df in dfs:
        if not df.empty:
            aligned.append(df.copy())
    if len(aligned) == 0:
        return tuple()
    return tuple(pd.concat(aligned, axis=1).align(*aligned, copy=False))