from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List
import logging

from app.models.job_models import (
    JobSearchRequest, 
    JobSearchResponse, 
    ErrorResponse,
    JobResult
)
from app.services.job_service import find_jobs

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/jobs",
    tags=["jobs"],
    responses={
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)


@router.post(
    "/search",
    response_model=JobSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search for jobs",
    description="Search for jobs using job title, location, experience level and number of results"
)
async def search_jobs(request: JobSearchRequest) -> JobSearchResponse:
    """
    Search for jobs using the SerpApi Google Jobs API.
    
    - **job_title**: Job title to search for (required)
    - **location**: Location to search in (required)  
    - **experience**: Experience level (optional)
    - **job_count**: Number of jobs to return (1-50, default: 10)
    - **api_keys**: API keys including serpapi_key (required)
    
    Returns a list of job results with company information, descriptions, and application links.
    """
    try:
        logger.info(f"Job search request: {request.job_title} in {request.location}")
        
        # Validate API key
        if not request.api_keys or not request.api_keys.serpapi_key:
            raise ValueError("SerpAPI key is required")
        
        # Call the job service
        jobs = await find_jobs(
            job_title=request.job_title,
            location=request.location,
            experience=request.experience.value if request.experience else None,
            job_count=request.job_count,
            serpapi_key=request.api_keys.serpapi_key
        )
        
        response = JobSearchResponse(
            success=True,
            message=f"Found {len(jobs)} jobs for '{request.job_title}' in {request.location}",
            jobs=jobs,
            total_count=len(jobs)
        )
        
        logger.info(f"Successfully returned {len(jobs)} jobs")
        return response
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error. Please contact support."
        )
    except Exception as e:
        logger.error(f"Error during job search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search for jobs: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if the job service is working properly"
)
async def health_check():
    """
    Health check endpoint to verify the job service is operational.
    """
    return {"status": "healthy", "service": "job-search"}


@router.get(
    "/experience-levels",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    summary="Get available experience levels",
    description="Get list of available experience levels for job search"
)
async def get_experience_levels() -> List[str]:
    """
    Get the list of available experience levels.
    """
    from app.models.job_models import ExperienceLevel
    return [level.value for level in ExperienceLevel]
