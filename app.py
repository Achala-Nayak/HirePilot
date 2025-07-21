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

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


st.set_page_config(
    page_title="HirePilot",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="auto",
)


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
                    # Using your improved, more robust link-finding logic
                    job_url = job.get("apply_link") or job.get("via") or (job.get("related_links", [{}])[0].get("link") if job.get("related_links") else None)
                    jobs_list.append({
                        "title": job.get("title"),
                        "company_name": job.get("company_name"),
                        "location": job.get("location", "Not specified"),
                        "description": job.get("description"),
                        "job_url": job_url
                    })
            return jobs_list
        except httpx.HTTPStatusError as e:
            st.error(f"API Error: Failed to fetch jobs. Please check your SerpApi key. Status: {e.response.status_code}")
            return []
        except Exception as e:
            st.error(f"An unexpected error occurred: {e}")
            return []

async def tailor_resume_with_llm(resume_text: str, job_description: str):
    """Uses the Google Gemini API to tailor a resume."""
    gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"
    prompt = f"""
    **System Prompt:** You are an expert career coach and resume writer. Your task is to revise a user's resume to perfectly align with a specific job description. Retain the core information and structure of the original resume, but rephrase bullet points, emphasize key skills mentioned in the job description, and add a professional summary that mirrors the job's requirements. The output must be only the full text of the revised resume, with no extra commentary or introductory phrases.

    **User's Resume:**
    {resume_text}

    **Job Description:**
    {job_description}

    **Revised Resume:**
    """
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {'Content-Type': 'application/json'}

    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            response = await client.post(gemini_api_url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            if result.get("candidates") and result["candidates"][0].get("content"):
                return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                st.error("The API response was successful but did not contain the expected content.")
                st.json(result)
                return None
        except httpx.HTTPStatusError as e:
            st.error(f"API Error: Failed to tailor resume. Please check your Gemini API key. Status: {e.response.status_code}")
            st.json(e.response.json())
            return None
        except Exception as e:
            st.error(f"An unexpected error occurred during resume tailoring: {e}")
            return None


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
                
                if job_url and job_url.startswith(('http://', 'https://')):
                    st.link_button("Apply Here", job_url, use_container_width=True)
                else:

                    st.caption("No direct link")
            
            with st.expander("See Job Description & Tailor Resume"):
                st.markdown(job['description'])
                
                if st.button("✨ Tailor Resume for this Job", key=f"tailor_{i}", use_container_width=True):
                    with st.spinner("Your personal career coach is rewriting your resume..."):
                        tailored_resume = asyncio.run(tailor_resume_with_llm(st.session_state.resume_text, job['description']))
                        
                        if tailored_resume:
                            st.session_state[f'tailored_{i}'] = tailored_resume

                        if st.session_state.get(f'tailored_{i}'):
                            st.divider()
                            st.success("Resume tailored successfully!")
                            
                            res_col1, res_col2 = st.columns(2)
                            with res_col1:
                                st.subheader("Original Resume")
                                st.text_area("", st.session_state.resume_text, height=400, key=f"orig_{i}")
                            with res_col2:
                                st.subheader("AI-Tailored Resume")
                                st.text_area("", st.session_state[f'tailored_{i}'], height=400, key=f"new_{i}")
