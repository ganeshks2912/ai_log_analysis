from fastapi import FastAPI

app = FastAPI(
    title="AI Log Bot Detection ML Service",
    version="1.0.0",
)

@app.get("/health")
def health():
    return {
        "success": True,
        "service": "ml",
        "status": "healthy",
    }
