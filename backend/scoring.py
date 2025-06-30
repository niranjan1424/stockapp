import pandas as pd

def generate_score(row: pd.Series) -> int:
    try:
        score = 0
        close = float(row["Close"]) if pd.notna(row["Close"]) else None
        ma20 = float(row["MA20"]) if pd.notna(row["MA20"]) else None
        ma50 = float(row["MA50"]) if pd.notna(row["MA50"]) else None
        rsi = float(row["RSI"]) if pd.notna(row["RSI"]) else None
        bb_lower = float(row["BB_lower"]) if pd.notna(row["BB_lower"]) else None
        support = float(row["Support"]) if pd.notna(row["Support"]) else None
        resistance = float(row["Resistance"]) if pd.notna(row["Resistance"]) else None
        volume_spike = bool(row.get("Volume_Spike", False))

        if ma20 and ma50 and ma20 > ma50:
            score += 1
        if rsi and rsi < 30:
            score += 1
        if close and bb_lower and close < bb_lower:
            score += 1
        if volume_spike:
            score += 1
        if close and support and close < support:
            score += 1
        if close and resistance and close > resistance:
            score -= 1

        return score

    except Exception as e:
        print(f"⚠ Error in generate_score: {e}")
        return 0