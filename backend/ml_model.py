from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.dummy import DummyRegressor
import pandas as pd

def train_ml_model(df: pd.DataFrame):
    df = df.dropna().copy()

    if len(df) < 60:
        print("❌ Not enough data for training")
        dummy = DummyRegressor(strategy="mean").fit(df[['MA20']], df['Close'])  # Train dummy for compatibility
        return dummy, 0.0

    required_features = ['MA20', 'MA50', 'RSI', 'BB_upper', 'BB_lower', 'ATR', 'Score']
    if not all(col in df.columns for col in required_features):
        print("❌ Missing required features in data")
        dummy = DummyRegressor(strategy="mean").fit(df[['MA20']], df['Close'])  # Fallback
        return dummy, 0.0

    # Target: Price after 10 days
    df['Future_Close'] = df['Close'].shift(-10)
    df = df.dropna(subset=['Future_Close'])

    if len(df) < 60:
        print("❌ Insufficient data after target shift")
        dummy = DummyRegressor(strategy="mean").fit(df[['MA20']], df['Close'])
        return dummy, 0.0

    # Add more robust features
    features = required_features.copy()
    if 'sentiment' in df.columns:
        features.append('sentiment')

    X = df[features]
    y = df['Future_Close']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    models = {
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(n_estimators=100, random_state=42),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=100, random_state=42)
    }

    best_model = None
    best_mse = float("inf")

    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mse = mean_squared_error(y_test, preds)
        print(f"{name} MSE: {mse:.2f}")
        if mse < best_mse:
            best_mse = mse
            best_model = model

    if best_model is None:
        print("⚠ No model outperformed fallback. Using DummyRegressor.")
        best_model = DummyRegressor(strategy="mean").fit(X_train, y_train)
        best_mse = mean_squared_error(y_test, best_model.predict(X_test))

    return best_model, best_mse
