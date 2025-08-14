from fastapi import APIRouter, Form
from typing import List

router = APIRouter()

@router.post("/search_jobs")
async def search_jobs(
    job_title: str = Form(...),
    job_location: str = Form(...),
    num_jobs: int = Form(...)
):

    jobs = []
    for i in range(num_jobs):
        jobs.append({
            "title": f"{job_title} - Position {i+1}",
            "company": f"Company {i+1}",
            "location": job_location,
            "link": f"https://example.com/job/{i+1}"
        })
    
    return {"jobs": jobs}
