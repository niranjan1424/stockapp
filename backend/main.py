from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fetch_data import analyze_stock
import uvicorn
from typing import Dict, Any
import logging

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "✅ Backend is running. Use /analyze?ticker=AAPL"}

@app.get("/analyze")
async def analyze(ticker: str = Query(..., example="AAPL")) -> Dict[str, Any]:
    try:
        result = await analyze_stock(ticker)
        if result.get("error"):
            return {"error": result["error"]}
        
        # Mock broker API
        if result.get("trade_action"):
            trade_result = f"Mock {result['trade_action']} of {ticker} at ${result['data'][-1]['Close']:.2f}"
            result["trade_status"] = trade_result
            logger.info(f"Trade executed: {trade_result}")
        
        return result
    except Exception as e:
        logger.error(f"Error in analyze: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)