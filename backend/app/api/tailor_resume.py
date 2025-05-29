from fastapi import APIRouter

router = APIRouter()

@router.post("/tailor-resume")
async def tailor_resume_endpoint():
    return {"message": "Endpoint stub"}
