import os
import sys
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

try:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in .env file or is empty.")
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Successfully configured Google AI.")
except Exception as e:
    print(f"❌ An error occurred during startup: {e}")
    sys.exit(1)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Payload(BaseModel):
    text: str
    code_snippet: str | None = None
    intent: str | None = 'suggest'

@app.post("/summarize/")
async def summarize_text(payload: Payload):
    prompt = f"Summarize this developer problem in one or two sentences: '{payload.text}'"
    try:
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Google AI: {str(e)}")

@app.post("/suggest/")
async def suggest_code(payload: Payload):
    # --- MODIFIED: Prompts are now more concise ---
    if payload.intent == 'explain':
        prompt = f"""You are an expert programmer AI assistant. Explain the following code snippet. 
        Be concise and use bullet points for clarity.
        Code: ```{payload.code_snippet}```"""
    else:
        prompt = f"""You are an expert programmer AI assistant. A user has this problem: "{payload.text}". 
        Here is their code: ```{payload.code_snippet}```. 
        Provide a corrected code snippet and a brief, to-the-point explanation."""
    try:
        response = model.generate_content(prompt)
        generated_text = response.text
        explanation = generated_text
        suggestion = ""
        if "```" in generated_text:
            parts = generated_text.split("```", 1)
            explanation = parts[0].strip()
            code_part = parts[1]
            suggestion = code_part.split("```")[0].strip()
            if "\n" in suggestion:
                suggestion = suggestion.split('\n', 1)[1]
        return {"suggestion": suggestion, "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Google AI: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)