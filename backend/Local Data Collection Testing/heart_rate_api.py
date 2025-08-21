from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
from typing import Optional

app = FastAPI()

# Fix CORS - This is the key part!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:3000",  # React default port
        "http://127.0.0.1:3000",  # Alternative localhost
        "*"  # Allow all origins (for development only)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Store the latest data
latest_data = {
    "timestamp": datetime.now().isoformat(),
    "hr": 67,
    "rr": None
}

class HeartRateData(BaseModel):
    timestamp: str
    hr: int
    rr: Optional[float] = None

@app.post("/heart-rate-data")
async def receive_heart_rate_data(data: HeartRateData):
    global latest_data
    latest_data = data.dict()
    print(f"✅ Received POST data: HR: {data.hr}, RR: {data.rr}")
    return {"status": "received"}

@app.get("/heart-rate-data")
async def get_heart_rate_data():
    print(f"📡 Serving GET request: {latest_data}")
    return latest_data

# Add a simple test endpoint
@app.get("/")
async def root():
    return {"message": "WHOOP API is running"}

if __name__ == "__main__":
    print("�� Starting server on http://localhost:8000")
    print("🔧 CORS enabled for frontend development")
    uvicorn.run(app, host="0.0.0.0", port=8000)