from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, jobs, resume
import os
from dotenv import load_dotenv

app = FastAPI(
    title="HirePilot API",
    description="AI-powered job search and resume tailoring service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://tryhirepilot.vercel.app",
        "https://*.vercel.app"
    ],  # Allow your deployed frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(resume.router)

@app.get("/")
async def root():
    return {"message": "Welcome to HirePilot API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn

    load_dotenv()
    host = os.getenv("HOST", "0.0.0.0")  # Default to all interfaces
    port = int(os.getenv("PORT", 8003))  # Default port 8003

    uvicorn.run("main:app", host=host, port=port, reload=True)

