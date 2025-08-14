from fastapi import APIRouter, File, UploadFile, Form
import shutil
import os

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload")
async def upload_resume(
    job_title: str = Form(...),
    job_location: str = Form(...),
    years_experience: int = Form(...),
    num_jobs: int = Form(...),
    file: UploadFile = File(...)
):

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "message": "File uploaded successfully ✅",
        "file_path": file_path,
        "job_title": job_title,
        "job_location": job_location,
        "years_experience": years_experience,
        "num_jobs": num_jobs
    }
