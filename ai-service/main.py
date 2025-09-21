import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- NEW: Google Gemini API Configuration ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file")

genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the models
summarizer_model = genai.GenerativeModel('gemini-1.5-flash')
suggestion_model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI()

# Configure CORS
origins = ["http://localhost", "http://localhost:5173", "http://localhost:5000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class SummarizePayload(BaseModel):
    text: str

class SuggestPayload(BaseModel):
    text: str
    code_snippet: str | None = None

@app.get("/")
async def read_root():
    return {"message": "VoicePair AI Service (Google Gemini Mode) is running!"}

@app.post("/summarize/")
async def summarize_text(payload: SummarizePayload):
    prompt = f"Please summarize the following developer problem description in one or two sentences: '{payload.text}'"
    try:
        response = summarizer_model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Google AI: {str(e)}")

@app.post("/suggest/")
async def suggest_code(payload: SuggestPayload):
    prompt = f"""
You are an expert programmer AI assistant. A user is facing the following problem: "{payload.text}"

Here is their current code snippet:
{payload.code_snippet if payload.code_snippet else "No code provided."}

Based on the problem description, provide a corrected or improved code snippet and a brief, clear explanation of the changes. Structure your response with the explanation first, followed by the code block.
"""
    try:
        response = suggestion_model.generate_content(prompt)
        generated_text = response.text
        
        # Parse the response to separate explanation from code
        explanation = generated_text
        suggestion = ""
        if "```" in generated_text:
            parts = generated_text.split("```", 1)
            explanation = parts[0].strip()
            code_part = parts[1]
            suggestion = code_part.split("```")[0].strip()
            # Remove language hint if present (e.g., "python\n")
            if "\n" in suggestion:
                suggestion = suggestion.split('\n', 1)[1]

        return {"suggestion": suggestion, "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Google AI: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)