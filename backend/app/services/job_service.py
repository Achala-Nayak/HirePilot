import os
import httpx
from typing import List, Optional
from urllib.parse import urlparse
import logging

from app.models.job_models import JobResult

logger = logging.getLogger(__name__)


def is_valid_url(url: str) -> bool:
    """Check if a URL is valid and accessible"""
    if not url:
        return False
    
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def extract_job_url(job_data: dict) -> Optional[str]:
    """Extract the best available job URL from job data with multiple fallback options"""
    
    url_fields = [
        'apply_link',
        'redirect_link', 
        'related_links',
        'via',
        'share_link'
    ]
    
    for field in url_fields:
        url = job_data.get(field)
        if url and is_valid_url(url):
            return url
    
    # Create a fallback search URL if no direct URL found
    title = job_data.get('title', '')
    company = job_data.get('company_name', '')
    if title and company:
        search_query = f"{title} {company}".replace(' ', '+')
        return f"https://www.google.com/search?q={search_query}+jobs"
    
    return None


async def find_jobs(job_title: str, location: str, experience: Optional[str], job_count: int, serpapi_key: str) -> List[JobResult]:
    """
    Asynchronously searches for jobs using the SerpApi Google Jobs API.
    """
    if not serpapi_key:
        raise ValueError("SERPAPI_KEY is required but not provided")
    
    serpapi_url = "https://serpapi.com/search.json"
    
    # Build search query
    query_parts = [job_title]
    if experience:
        query_parts.append(f"with {experience} experience")
    query_parts.append(f"in {location}")
    search_query = " ".join(query_parts)

    params = {
        "engine": "google_jobs",
        "q": search_query,
        "api_key": serpapi_key,
        "hl": "en",
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(serpapi_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            jobs_list = []
            
            if "jobs_results" in data:
                for job in data["jobs_results"][:job_count]:
                    job_url = extract_job_url(job)
                    
                    job_result = JobResult(
                        title=job.get("title"),
                        company_name=job.get("company_name"),
                        location=job.get("location", "Not specified"),
                        description=job.get("description"),
                        job_url=job_url,
                        job_id=job.get("job_id"),
                        raw_data=job
                    )
                    jobs_list.append(job_result)
            
            return jobs_list
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred: {e.response.status_code}")
            raise Exception(f"API Error: Failed to fetch jobs. Status: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Request error occurred: {e}")
            raise Exception("Network error: Unable to connect to job search API")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise Exception(f"Unexpected error occurred: {str(e)}")
