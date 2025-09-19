import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from transformers import pipeline

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS - important for frontend communication
origins = [
    "http://localhost",
    "http://localhost:5173", # Frontend's default port
    "http://localhost:5000", # Backend's default port (useful for direct testing)
    # Add your deployed frontend/backend URLs here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Model Initialization ---
# Global variable to hold the summarization pipeline
summarizer_pipeline = None

@app.on_event("startup")
async def load_model():
    """
    Loads the summarization model when the FastAPI application starts.
    """
    global summarizer_pipeline
    print("Loading summarization model... This may take a moment.")
    try:
        # Using a smaller, efficient model suitable for summarization
        # 'sshleifer/distilbart-cnn-12-6' is a good balance of size and performance
        summarizer_pipeline = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
        print("Summarization model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        # Depending on severity, you might want to exit or log more verbosely
        # For now, we'll let the app start but summarization will fail if model didn't load.
        raise HTTPException(status_code=500, detail="Failed to load AI model")


# --- API Endpoints ---

@app.get("/")
async def read_root():
    if summarizer_pipeline:
        return {"message": "VoicePair AI Service is running and model is loaded!"}
    else:
        return {"message": "VoicePair AI Service is running, but model failed to load.", "status": "error"}

@app.post("/summarize/")
async def summarize_text(payload: dict):
    if not summarizer_pipeline:
        raise HTTPException(status_code=503, detail="AI model not loaded. Service unavailable.")

    input_text = payload.get("text")
    if not input_text:
        raise HTTPException(status_code=400, detail="Text content is required for summarization.")

    try:
        # Summarize the text using the loaded pipeline
        # You can adjust min_length, max_length, etc. for desired summary size
        # max_length should generally be less than the model's max input (e.g., 1024 for BART)
        summary_results = summarizer_pipeline(input_text, max_length=150, min_length=30, do_sample=False)
        generated_summary = summary_results[0]['summary_text']

        return {
            "summary": generated_summary,
            "original_length": len(input_text),
            "summary_length": len(generated_summary)
        }
    except Exception as e:
        print(f"Error during summarization: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing summarization: {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)