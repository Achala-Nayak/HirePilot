# app.py
# An all-in-one Streamlit application for HirePilot.
# This version fixes the job link redirection issue using a more robust method.

import streamlit as st
import os
import httpx
from dotenv import load_dotenv
import PyPDF2
from io import BytesIO
import asyncio
import re
from urllib.parse import urlparse

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


st.set_page_config(
    page_title="HirePilot",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="auto",
)


def is_valid_url(url):
    """Check if a URL is valid and accessible"""
    if not url:
        return False
    
    try:
        parsed = urlparse(url)
        return bool(parsed.netloc) and bool(parsed.scheme) and parsed.scheme in ['http', 'https']
    except Exception:
        return False


def extract_job_url(job_data):
    """Extract the best available job URL from job data with multiple fallback options"""
    
    # Priority order for URL extraction
    url_fields = [
        'apply_link',
        'redirect_link', 
        'related_links',
        'via',
        'share_link'
    ]
    
    for field in url_fields:
        if field == 'related_links' and job_data.get('related_links'):
            # Handle related_links which is typically a list
            for link_obj in job_data['related_links']:
                if isinstance(link_obj, dict) and 'link' in link_obj:
                    url = link_obj['link']
                    if is_valid_url(url):
                        return url
        else:
            url = job_data.get(field)
            if is_valid_url(url):
                return url
    
    # If no direct apply link, try to construct a search URL
    title = job_data.get('title', '')
    company = job_data.get('company_name', '')
    if title and company:
        # Create a Google search URL as fallback
        search_query = f"{title} {company} job application"
        return f"https://www.google.com/search?q={search_query.replace(' ', '+')}"
    
    return None


async def find_jobs(job_title: str, location: str, experience: str, job_count: int):
    """
    Asynchronously searches for jobs using the SerpApi Google Jobs API.
    Includes the experience level and uses a robust method to find the job URL.
    """
    serpapi_url = "https://serpapi.com/search.json"
    
    query_parts = [job_title]
    if experience:
        query_parts.append(f"with {experience} experience")
    query_parts.append(f"in {location}")
    search_query = " ".join(query_parts)

    params = {
        "engine": "google_jobs",
        "q": search_query,
        "api_key": SERPAPI_KEY,
        "hl": "en",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(serpapi_url, params=params)
            response.raise_for_status()
            data = response.json()
            jobs_list = []
            
            if "jobs_results" in data:
                for job in data["jobs_results"][:job_count]:
                    job_url = extract_job_url(job)
                    
                    jobs_list.append({
                        "title": job.get("title"),
                        "company_name": job.get("company_name"),
                        "location": job.get("location", "Not specified"),
                        "description": job.get("description"),
                        "job_url": job_url,
                        "job_id": job.get("job_id"),  # Keep job_id for debugging
                        "raw_data": job  # Keep raw data for debugging (remove in production)
                    })
            return jobs_list
        except httpx.HTTPStatusError as e:
            st.error(f"API Error: Failed to fetch jobs. Please check your SerpApi key. Status: {e.response.status_code}")
            return []
        except Exception as e:
            st.error(f"An unexpected error occurred: {e}")
            return []


async def tailor_resume_with_llm(resume_text: str, job_description: str):
    """Uses the Google Gemini API to tailor a resume while maintaining original structure."""
    gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
    prompt = f"""
    You are an expert ATS-optimized resume writer and career coach. Your task is to strategically tailor a resume to maximize shortlisting chances for a specific job while maintaining the exact original structure, formatting, and visual appearance.

    **CRITICAL REQUIREMENTS:**
    1. PRESERVE the exact structure, section order, formatting, and visual layout of the original resume
    2. MAINTAIN all contact information, links, URLs, and personal details exactly as provided
    3. KEEP the same number of sections and subsections in the same order
    4. PRESERVE original formatting (bullet points, spacing, capitalization style, etc.)
    5. DO NOT add or remove sections - only optimize content within existing sections

    **OPTIMIZATION STRATEGY:**
    1. **Keyword Integration**: Naturally incorporate relevant keywords from the job description into existing bullet points and descriptions
    2. **Skills Alignment**: Emphasize skills mentioned in the JD within existing content areas
    3. **Quantified Achievements**: Enhance existing achievements with metrics where appropriate
    4. **Professional Summary**: If one exists, align it with job requirements; if not, don't add one
    5. **ATS Optimization**: Use industry-standard terminology and action verbs that match the job posting
    6. **Experience Relevance**: Reframe existing experience points to highlight relevance to the target role

    **CONTENT ENHANCEMENT RULES:**
    - Replace generic descriptions with role-specific, impactful language
    - Use strong action verbs (Led, Developed, Implemented, Optimized, etc.)
    - Include relevant technical skills and tools mentioned in the job description
    - Quantify achievements wherever possible (percentages, numbers, timeframes)
    - Mirror the job description's language and terminology naturally
    - Ensure consistency in tense and formatting throughout

    **Original Resume:**
    {resume_text}

    **Target Job Description:**
    {job_description}

    **Instructions:** Return ONLY the complete tailored resume with no additional commentary, explanations, or formatting changes. The output should be ready for immediate use and download.

    **Tailored Resume:**
    """
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {'Content-Type': 'application/json'}

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(gemini_api_url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            if result.get("candidates") and result["candidates"][0].get("content"):
                return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                st.error("The API response was successful but did not contain the expected content.")
                return None
        except httpx.HTTPStatusError as e:
            st.error(f"API Error: Failed to tailor resume. Please check your Gemini API key. Status: {e.response.status_code}")
            return None
        except Exception as e:
            st.error(f"An unexpected error occurred during resume tailoring: {e}")
            return None


def create_download_link(text_content, filename, link_text):
    """Create a download link for text content"""
    import base64
    b64 = base64.b64encode(text_content.encode()).decode()
    href = f'<a href="data:text/plain;base64,{b64}" download="{filename}" style="text-decoration: none; color: white; background-color: #00cc44; padding: 8px 16px; border-radius: 4px; font-weight: bold;">{link_text}</a>'
    return href


def extract_text_from_pdf(file):
    """Extracts text from an uploaded PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(file.getvalue()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        st.error(f"Error reading PDF file: {e}")
        return ""


st.title("✈️ HirePilot")
st.markdown("Your AI-powered co-pilot for job hunting. Find jobs and tailor your resume instantly.")


if 'jobs' not in st.session_state:
    st.session_state.jobs = []
if 'resume_text' not in st.session_state:
    st.session_state.resume_text = ""


with st.sidebar:
    st.header("1. Your Details")
    job_title = st.text_input("Job Title / Role", placeholder="e.g., Software Engineer")
    location = st.text_input("Job Location", placeholder="e.g., San Francisco, CA")
    experience = st.text_input("Years of Experience", placeholder="e.g., 2 years")
    job_count = st.slider("Number of Jobs to Find", min_value=5, max_value=50, value=10)
    
    st.header("2. Your Resume")
    uploaded_file = st.file_uploader("Upload your Resume (PDF only)", type=['pdf'])
    
    if uploaded_file:
        st.session_state.resume_text = extract_text_from_pdf(uploaded_file)
        if st.session_state.resume_text:
            st.success("✅ Resume uploaded and parsed successfully!")
            with st.expander("View Resume Text"):
                st.text_area("", st.session_state.resume_text, height=200, disabled=True)

    find_jobs_button = st.button("Find Jobs", type="primary", use_container_width=True)



if find_jobs_button:
    if not all([job_title, location, experience, st.session_state.resume_text]):
        st.warning("Please fill in all fields (including experience) and upload your resume before searching.")
    elif not SERPAPI_KEY or not GEMINI_API_KEY:
        st.error("API keys are not configured. Please add them to your .env file.")
    else:
        with st.spinner("Searching for the best opportunities..."):
            st.session_state.jobs = asyncio.run(find_jobs(job_title, location, experience, job_count))
            if not st.session_state.jobs:
                st.warning("No jobs found. Try broadening your search criteria.")

if st.session_state.jobs:
    st.header("Found Opportunities")
    for i, job in enumerate(st.session_state.jobs):
        with st.container(border=True):
            col1, col2 = st.columns([4, 1])
            with col1:
                st.subheader(job['title'])
                st.caption(f"🏢 {job['company_name']} | 📍 {job['location']}")
            
            with col2:
                job_url = job.get('job_url')
                
                if job_url:
                    # Use HTML with target="_blank" to ensure it opens in a new tab
                    st.markdown(
                        f'<a href="{job_url}" target="_blank" style="text-decoration: none;">'
                        f'<div style="background-color: #0066cc; color: white; padding: 8px 16px; '
                        f'text-align: center; border-radius: 4px; font-weight: bold; cursor: pointer;">'
                        f'Apply Here</div></a>',
                        unsafe_allow_html=True
                    )
                    # Debug info (remove in production)
                    with st.expander("🔍 Debug URL Info", expanded=False):
                        st.text(f"URL: {job_url}")
                        st.text(f"Valid: {is_valid_url(job_url)}")
                        if 'raw_data' in job:
                            available_links = {k: v for k, v in job['raw_data'].items() 
                                             if 'link' in k.lower() or k in ['apply_link', 'via', 'related_links']}
                            st.json(available_links)
                else:
                    st.caption("❌ No link available")
            
            with st.expander("See Job Description & Tailor Resume"):
                st.markdown("### Job Description")
                st.markdown(job['description'])
                st.divider()
                
                col_tailor1, col_tailor2 = st.columns([3, 1])
                with col_tailor1:
                    if st.button("✨ Tailor Resume for this Job", key=f"tailor_{i}", use_container_width=True):
                        with st.spinner("🤖 AI is optimizing your resume for maximum ATS compatibility and shortlisting chances..."):
                            tailored_resume = asyncio.run(tailor_resume_with_llm(st.session_state.resume_text, job['description']))
                            
                            if tailored_resume:
                                st.session_state[f'tailored_{i}'] = tailored_resume
                                st.rerun()  # Refresh to show the results immediately

                # Show tailored resume if it exists
                if st.session_state.get(f'tailored_{i}'):
                    st.divider()
                    st.success("🎯 Resume tailored successfully! Optimized for ATS and keyword matching.")
                    
                    # Download button
                    with col_tailor2:
                        if st.session_state.get(f'tailored_{i}'):
                            company_name = job['company_name'].replace(' ', '_').replace('/', '-')
                            job_title_clean = job['title'].replace(' ', '_').replace('/', '-')
                            filename = f"Resume_Tailored_{company_name}_{job_title_clean}.txt"
                            
                            st.markdown(
                                create_download_link(
                                    st.session_state[f'tailored_{i}'], 
                                    filename, 
                                    "📥 Download Resume"
                                ), 
                                unsafe_allow_html=True
                            )
                    
                    # Display comparison
                    st.markdown("### 📊 Resume Comparison")
                    res_col1, res_col2 = st.columns(2)
                    
                    with res_col1:
                        st.markdown("#### Original Resume")
                        st.text_area(
                            "Original", 
                            st.session_state.resume_text, 
                            height=500, 
                            key=f"orig_{i}",
                            help="Your original resume content"
                        )
                    
                    with res_col2:
                        st.markdown("#### 🎯 ATS-Optimized Resume")
                        st.text_area(
                            "Tailored", 
                            st.session_state[f'tailored_{i}'], 
                            height=500, 
                            key=f"new_{i}",
                            help="AI-optimized resume tailored for this specific job"
                        )