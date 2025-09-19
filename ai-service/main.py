import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS - important for frontend communication
# In a production environment, you would restrict origins to your frontend's domain
origins = [
    "http://localhost",
    "http://localhost:5173", # Frontend's default port
    # Add your deployed frontend URL here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic "Hello AI Service" route
@app.get("/")
async def read_root():
    return {"message": "VoicePair AI Service is running!"}

# Example AI endpoint (we'll build this out later)
@app.post("/summarize/")
async def summarize_text(text: dict):
    # In a real scenario, we'd use a transformer model here
    input_text = text.get("text", "No text provided.")
    summary = f"Simulated summary for: '{input_text[:50]}...' (AI not yet integrated)"
    return {"summary": summary, "original_length": len(input_text)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8001)) # Use port from .env or default to 8001
    uvicorn.run(app, host="0.0.0.0", port=port)