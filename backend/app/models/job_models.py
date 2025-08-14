from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from enum import Enum


class ExperienceLevel(str, Enum):
    """Enum for experience levels"""
    ENTRY = "entry level"
    JUNIOR = "junior"
    MID = "mid level" 
    SENIOR = "senior"
    LEAD = "lead"
    EXECUTIVE = "executive"


class JobSearchRequest(BaseModel):
    """Request model for job search"""
    job_title: str = Field(..., min_length=1, max_length=100, description="Job title to search for")
    location: str = Field(..., min_length=1, max_length=100, description="Location to search in")
    experience: Optional[ExperienceLevel] = Field(None, description="Experience level requirement")
    job_count: int = Field(default=10, ge=1, le=50, description="Number of jobs to return (1-50)")


class JobResult(BaseModel):
    """Model for individual job result"""
    title: Optional[str] = Field(None, description="Job title")
    company_name: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="Job location")
    description: Optional[str] = Field(None, description="Job description")
    job_url: Optional[str] = Field(None, description="URL to apply for the job")
    job_id: Optional[str] = Field(None, description="Unique job identifier")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Raw job data from API")


class JobSearchResponse(BaseModel):
    """Response model for job search"""
    success: bool = Field(..., description="Whether the search was successful")
    message: str = Field(..., description="Response message")
    jobs: List[JobResult] = Field(default_factory=list, description="List of job results")
    total_count: int = Field(default=0, description="Total number of jobs found")


class ResumeTailorRequest(BaseModel):
    """Request model for resume tailoring"""
    resume_text: str = Field(..., min_length=1, description="Original resume text content")
    job_description: str = Field(..., min_length=1, description="Job description to tailor resume for")
    job_title: str = Field(..., min_length=1, max_length=200, description="Job title")
    company_name: str = Field(..., min_length=1, max_length=200, description="Company name")


class ResumeTailorResponse(BaseModel):
    """Response model for resume tailoring"""
    success: bool = Field(..., description="Whether the tailoring was successful")
    message: str = Field(..., description="Response message")
    tailored_resume_text: Optional[str] = Field(None, description="Tailored resume text")
    filename: Optional[str] = Field(None, description="Suggested filename for the tailored resume")


class ResumeParseRequest(BaseModel):
    """Request model for resume parsing"""
    resume_text: str = Field(..., min_length=1, description="Resume text to parse")


class ResumeParseResponse(BaseModel):
    """Response model for resume parsing"""
    success: bool = Field(..., description="Whether the parsing was successful")
    message: str = Field(..., description="Response message")
    parsed_data: Optional[Dict[str, str]] = Field(None, description="Parsed resume data in sections")


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(False, description="Always false for errors")
    message: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code for debugging")
