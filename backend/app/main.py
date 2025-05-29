from fastapi import FastAPI
from app.api import tailor_resume

app = FastAPI()
app.include_router(tailor_resume.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"msg": "HirePilot backend is running"}
