from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional
import PyPDF2
from io import BytesIO
import logging

from app.models.job_models import (
    ResumeTailorRequest,
    ResumeTailorResponse,
    ResumeParseRequest,
    ResumeParseResponse,
    ResumePDFGenerateRequest,
    ErrorResponse
)
from app.services.resume_service import (
    generate_tailored_pdf,
    generate_pdf_from_tailored_text,
    parse_resume_only,
    tailor_resume_with_llm
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/resume",
    tags=["resume"],
    responses={
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file content."""
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"Error reading PDF file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading PDF file: {str(e)}"
        )


@router.post(
    "/tailor",
    response_model=ResumeTailorResponse,
    status_code=status.HTTP_200_OK,
    summary="Tailor resume for a specific job",
    description="Use AI to tailor a resume for a specific job posting to improve selection chances"
)
async def tailor_resume(request: ResumeTailorRequest) -> ResumeTailorResponse:
    """
    Tailor a resume for a specific job using AI.
    
    - **resume_text**: Original resume text content
    - **job_description**: Job description to tailor resume for
    - **job_title**: Job title for the position
    - **company_name**: Company name for the position
    
    Returns a tailored resume text optimized for the specific job posting.
    """
    try:
        logger.info(f"Resume tailoring request for {request.job_title} at {request.company_name}")
        
        # Tailor the resume using AI
        tailored_resume = await tailor_resume_with_llm(
            resume_text=request.resume_text,
            job_description=request.job_description
        )
        
        if not tailored_resume:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to tailor resume. Please try again."
            )
        
        # Generate filename
        company_clean = request.company_name.replace(' ', '_').replace('/', '-')
        job_title_clean = request.job_title.replace(' ', '_').replace('/', '-')
        filename = f"Tailored_Resume_{company_clean}_{job_title_clean}.txt"
        
        response = ResumeTailorResponse(
            success=True,
            message=f"Resume successfully tailored for {request.job_title} at {request.company_name}",
            tailored_resume_text=tailored_resume,
            filename=filename
        )
        
        logger.info(f"Successfully tailored resume for {request.job_title} at {request.company_name}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during resume tailoring: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tailor resume: {str(e)}"
        )


@router.post(
    "/tailor-pdf",
    status_code=status.HTTP_200_OK,
    summary="Tailor resume and generate PDF",
    description="Use AI to tailor a resume for a specific job and generate a professional PDF",
    response_class=Response
)
async def tailor_resume_pdf(request: ResumeTailorRequest):
    """
    Tailor a resume for a specific job and generate a professional PDF.
    
    - **resume_text**: Original resume text content
    - **job_description**: Job description to tailor resume for
    - **job_title**: Job title for the position
    - **company_name**: Company name for the position
    
    Returns a PDF file with the tailored resume.
    """
    try:
        logger.info(f"PDF generation request for {request.job_title} at {request.company_name}")
        
        # Generate tailored PDF
        pdf_data, result = await generate_tailored_pdf(
            resume_text=request.resume_text,
            job_description=request.job_description,
            job_title=request.job_title,
            company_name=request.company_name
        )
        
        if not pdf_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate PDF: {result}"
            )
        
        # Return PDF as response
        headers = {
            'Content-Disposition': f'attachment; filename="{result}"',
            'Content-Type': 'application/pdf'
        }
        
        logger.info(f"Successfully generated PDF for {request.job_title} at {request.company_name}")
        return Response(content=pdf_data, media_type="application/pdf", headers=headers)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during PDF generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post(
    "/generate-pdf-from-text",
    status_code=status.HTTP_200_OK,
    summary="Generate PDF from tailored resume text",
    description="Generate a professional PDF from already tailored resume text",
    response_class=Response
)
async def generate_pdf_from_text(request: ResumePDFGenerateRequest):
    """
    Generate a PDF from tailored resume text.
    
    - **tailored_resume_text**: Already tailored resume text content
    - **job_title**: Job title for the position
    - **company_name**: Company name for the position
    
    Returns a PDF file with the tailored resume.
    """
    try:
        logger.info(f"PDF generation from text request for {request.job_title} at {request.company_name}")
        
        # Generate PDF from tailored text
        pdf_data, result = await generate_pdf_from_tailored_text(
            tailored_resume_text=request.tailored_resume_text,
            job_title=request.job_title,
            company_name=request.company_name
        )
        
        if not pdf_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate PDF: {result}"
            )
        
        # Return PDF as response
        headers = {
            'Content-Disposition': f'attachment; filename="{result}"',
            'Content-Type': 'application/pdf'
        }
        
        logger.info(f"Successfully generated PDF from text for {request.job_title} at {request.company_name}")
        return Response(content=pdf_data, media_type="application/pdf", headers=headers)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during PDF generation from text: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF from text: {str(e)}"
        )


@router.post(
    "/upload-and-tailor-pdf",
    status_code=status.HTTP_200_OK,
    summary="Upload PDF resume and tailor for job",
    description="Upload a PDF resume, extract text, tailor it for a job, and return a tailored PDF",
    response_class=Response
)
async def upload_and_tailor_pdf(
    file: UploadFile = File(..., description="PDF resume file"),
    job_description: str = Form(..., description="Job description to tailor resume for"),
    job_title: str = Form(..., description="Job title for the position"),
    company_name: str = Form(..., description="Company name for the position")
):
    """
    Upload a PDF resume, extract text, tailor it for a specific job, and return a professional tailored PDF.
    
    This endpoint combines file upload, text extraction, AI tailoring, and PDF generation in one call.
    """
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )
        
        logger.info(f"Upload and tailor request for {job_title} at {company_name}")
        
        # Read and extract text from uploaded PDF
        file_content = await file.read()
        resume_text = extract_text_from_pdf(file_content)
        
        if not resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted from the PDF file"
            )
        
        # Generate tailored PDF
        pdf_data, result = await generate_tailored_pdf(
            resume_text=resume_text,
            job_description=job_description,
            job_title=job_title,
            company_name=company_name
        )
        
        if not pdf_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate tailored PDF: {result}"
            )
        
        # Return PDF as response
        headers = {
            'Content-Disposition': f'attachment; filename="{result}"',
            'Content-Type': 'application/pdf'
        }
        
        logger.info(f"Successfully processed upload and generated tailored PDF for {job_title} at {company_name}")
        return Response(content=pdf_data, media_type="application/pdf", headers=headers)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during upload and tailor process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process upload and generate tailored PDF: {str(e)}"
        )


@router.post(
    "/parse",
    response_model=ResumeParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse resume text into structured data",
    description="Parse resume text and extract structured information using AI"
)
async def parse_resume(request: ResumeParseRequest) -> ResumeParseResponse:
    """
    Parse resume text into structured data sections.
    
    - **resume_text**: Resume text to parse
    
    Returns structured resume data organized by sections.
    """
    try:
        logger.info("Resume parsing request received")
        
        # Parse resume using AI
        parsed_data, message = await parse_resume_only(request.resume_text)
        
        if not parsed_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse resume: {message}"
            )
        
        response = ResumeParseResponse(
            success=True,
            message=message,
            parsed_data=parsed_data
        )
        
        logger.info("Successfully parsed resume")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during resume parsing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse resume: {str(e)}"
        )


@router.post(
    "/extract-from-pdf",
    status_code=status.HTTP_200_OK,
    summary="Extract text from PDF resume",
    description="Upload a PDF resume and extract text content"
)
async def extract_from_pdf(file: UploadFile = File(..., description="PDF resume file")):
    """
    Extract text content from an uploaded PDF resume.
    
    Useful for getting the text content before tailoring or parsing.
    """
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )
        
        logger.info(f"Text extraction request for file: {file.filename}")
        
        # Read and extract text from uploaded PDF
        file_content = await file.read()
        resume_text = extract_text_from_pdf(file_content)
        
        if not resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted from the PDF file"
            )
        
        logger.info(f"Successfully extracted text from {file.filename}")
        return {
            "success": True,
            "message": "Text extracted successfully from PDF",
            "resume_text": resume_text,
            "filename": file.filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during text extraction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if the resume service is working properly"
)
async def health_check():
    """
    Health check endpoint to verify the resume service is operational.
    """
    return {"status": "healthy", "service": "resume-processing"}
