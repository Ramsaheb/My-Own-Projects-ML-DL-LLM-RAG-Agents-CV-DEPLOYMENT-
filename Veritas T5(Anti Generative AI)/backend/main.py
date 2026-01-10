"""
VERITAS API - Truth Filter Backend
A text sanitization service that strips corporate jargon and reveals clear meaning.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from transformers import T5ForConditionalGeneration, T5Tokenizer, pipeline
from typing import List, Optional
import uvicorn
import os

# Initialize FastAPI app
app = FastAPI(
    title="VERITAS API",
    description="Truth Filter API - Strip the noise, reveal the signal",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths - use absolute path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BACKEND_DIR, "..", "model", "veritas-t5-checkpoints", "checkpoint-11100")

# Global model instances
fixer = None
tokenizer = None


@app.on_event("startup")
async def load_model():
    """Load model and tokenizer at startup."""
    global fixer, tokenizer
    print("🔄 Loading VERITAS model...")
    print(f"📂 Model path: {MODEL_PATH}")
    
    # Load tokenizer using T5Tokenizer with legacy mode to avoid tokenizer.json issues
    tokenizer = T5Tokenizer.from_pretrained(MODEL_PATH, legacy=True)
    
    # Load model
    model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH)
    
    # Create pipeline with loaded model and tokenizer
    # Lock deterministic decoding to prevent semantic drift
    # But allow enough length for nuanced outputs
    fixer = pipeline(
        "text2text-generation",
        model=model,
        tokenizer=tokenizer,
        do_sample=False,
        num_beams=4,
        early_stopping=True
    )
    print("✅ VERITAS model loaded successfully!")


# ==================== Pydantic Models ====================

class SanitizeRequest(BaseModel):
    text: str = Field(
        ..., 
        description="Text to sanitize",
        example="We are seeking a rockstar ninja who thrives in a fast-paced environment and wears many hats."
    )

class SanitizeResponse(BaseModel):
    original_text: str
    clean_text: str
    original_tokens: int
    clean_tokens: int
    token_reduction: float
    words_removed: int
    efficiency_gain: str

class BatchSanitizeRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to sanitize", max_length=20)

class BatchSanitizeResponse(BaseModel):
    results: List[SanitizeResponse]
    total_token_reduction: float

class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    status: str
    is_model_loaded: bool
    version: str


# ==================== Helper Functions ====================

def count_tokens(text: str) -> int:
    """Count tokens in text using the model tokenizer."""
    return len(tokenizer.encode(text, add_special_tokens=False))


def count_words(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def calculate_reduction(original: int, clean: int) -> float:
    """Calculate percentage reduction."""
    if original == 0:
        return 0.0
    return round((original - clean) / original, 2)


def get_efficiency_label(reduction: float) -> str:
    """Get human-readable efficiency label."""
    if reduction >= 0.5:
        return "🔥 Massive cleanup"
    elif reduction >= 0.3:
        return "✨ Significant reduction"
    elif reduction >= 0.15:
        return "👍 Good optimization"
    elif reduction > 0:
        return "📝 Minor refinement"
    else:
        return "✅ Already clean"


# Truth Policy Guardrail - clarifies overly generic outputs
GENERIC_PHRASES = {
    "things are changing",
    "structures are being changed",
    "you will receive little guidance",
    "changes are happening",
    "the situation is evolving",
}

# Dismissive words that inject opinion instead of neutrality
DISMISSIVE_WORDS = {"basic", "just", "simply", "nothing new", "merely", "only"}

def apply_truth_guardrail(clean_text: str) -> str:
    """
    Apply policy guardrail to prevent over-generic or dismissive outputs.
    
    Veritas North Star:
    - Neutral ≠ dismissive
    - Compressed ≠ vague
    
    This is product philosophy, not model behavior.
    """
    normalized = clean_text.lower().strip().rstrip(".")
    
    # Flag generic phrases
    if normalized in GENERIC_PHRASES:
        return clean_text + " (stated expectation)"
    
    return clean_text


# ==================== API Endpoints ====================

@app.get("/", tags=["Root"])
async def root():
    """Welcome endpoint."""
    return {
        "message": "VERITAS API - Truth Filter",
        "tagline": "Strip the noise. Reveal the signal.",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if fixer else "loading",
        "is_model_loaded": fixer is not None,
        "version": "1.0.0"
    }


@app.post("/sanitize", response_model=SanitizeResponse, tags=["Sanitize"])
async def sanitize_text(request: SanitizeRequest):
    """
    Sanitize a single text.
    
    Transforms corporate jargon, buzzwords, and fluff into clear, honest language.
    Returns the cleaned text along with token reduction metrics.
    """
    if fixer is None:
        raise HTTPException(status_code=503, detail="Model still loading, please wait...")
    
    try:
        original_text = request.text.strip()
        
        # Prepare input with prefix
        model_input = f"neutralize: {original_text}"
        
        # Run inference with balanced decoding
        # max_length=96 allows nuance without verbosity
        # length_penalty=1.0 prevents over-compression
        output = fixer(
            model_input,
            max_length=96,
            min_length=10,
            do_sample=False,
            num_beams=4,
            length_penalty=1.0,
            early_stopping=True
        )
        clean_text = output[0]['generated_text']
        
        # Apply truth policy guardrail
        clean_text = apply_truth_guardrail(clean_text)
        
        # Calculate metrics
        original_tokens = count_tokens(original_text)
        clean_tokens = count_tokens(clean_text)
        original_words = count_words(original_text)
        clean_words = count_words(clean_text)
        token_reduction = calculate_reduction(original_tokens, clean_tokens)
        
        return {
            "original_text": original_text,
            "clean_text": clean_text,
            "original_tokens": original_tokens,
            "clean_tokens": clean_tokens,
            "token_reduction": token_reduction,
            "words_removed": max(0, original_words - clean_words),
            "efficiency_gain": get_efficiency_label(token_reduction)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/sanitize/batch", response_model=BatchSanitizeResponse, tags=["Sanitize"])
async def sanitize_batch(request: BatchSanitizeRequest):
    """
    Sanitize multiple texts at once.
    
    Accepts up to 20 texts and returns sanitized versions with metrics for each.
    """
    if fixer is None:
        raise HTTPException(status_code=503, detail="Model still loading, please wait...")
    
    try:
        results = []
        total_original_tokens = 0
        total_clean_tokens = 0
        
        for text in request.texts:
            original_text = text.strip()
            model_input = f"neutralize: {original_text}"
            output = fixer(
                model_input,
                max_length=96,
                min_length=10,
                do_sample=False,
                num_beams=4,
                length_penalty=1.0,
                early_stopping=True
            )
            clean_text = output[0]['generated_text']
            
            # Apply truth policy guardrail
            clean_text = apply_truth_guardrail(clean_text)
            
            original_tokens = count_tokens(original_text)
            clean_tokens = count_tokens(clean_text)
            original_words = count_words(original_text)
            clean_words = count_words(clean_text)
            token_reduction = calculate_reduction(original_tokens, clean_tokens)
            
            total_original_tokens += original_tokens
            total_clean_tokens += clean_tokens
            
            results.append({
                "original_text": original_text,
                "clean_text": clean_text,
                "original_tokens": original_tokens,
                "clean_tokens": clean_tokens,
                "token_reduction": token_reduction,
                "words_removed": max(0, original_words - clean_words),
                "efficiency_gain": get_efficiency_label(token_reduction)
            })
        
        total_reduction = calculate_reduction(total_original_tokens, total_clean_tokens)
        
        return {
            "results": results,
            "total_token_reduction": total_reduction
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


# ==================== Run Server ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
