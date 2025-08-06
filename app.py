import streamlit as st
import os
import httpx
from dotenv import load_dotenv
import PyPDF2
from io import BytesIO
import asyncio
import re
from urllib.parse import urlparse
import google.generativeai as genai
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.colors import black, darkblue
from reportlab.lib.units import inch
from datetime import datetime

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

st.set_page_config(
    page_title="HirePilot",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="auto",
)

@st.cache_resource
def configure_gemini(api_key):
    """Configure Gemini API and cache the model."""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        return model
    except Exception as e:
        st.error(f"Error configuring Gemini: {str(e)}")
        return None

@st.cache_resource
def get_resume_styles():
    """
    Initializes and returns a reportlab stylesheet with custom styles.
    """
    styles = getSampleStyleSheet()

    custom_styles = {
        'ResumeTitle': ParagraphStyle(
            name='ResumeTitle',
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            alignment=TA_CENTER,
            spaceAfter=6,
            textColor=darkblue
        ),
        'ContactInfo': ParagraphStyle(
            name='ContactInfo',
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            spaceAfter=18
        ),
        'SectionHeading': ParagraphStyle(
            name='SectionHeading',
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=14,
            alignment=TA_LEFT,
            spaceBefore=12,
            spaceAfter=6,
            textColor=darkblue,
            borderWidth=1,
            borderColor=darkblue,
            borderPadding=2
        ),
        'Content': ParagraphStyle(
            name='Content',
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
            spaceAfter=4,
            leftIndent=0
        ),
        'SubHeading': ParagraphStyle(
            name='SubHeading',
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
            spaceAfter=2,
            spaceBefore=4
        ),
        'BulletPoint': ParagraphStyle(
            name='BulletPoint',
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
            leftIndent=15,
            bulletIndent=5,
            spaceAfter=2
        )
    }

    for style_name, style_obj in custom_styles.items():
        if style_name not in styles:
            styles.add(style_obj)
    return styles

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
    
    url_fields = [
        'apply_link',
        'redirect_link', 
        'related_links',
        'via',
        'share_link'
    ]
    
    for field in url_fields:
        if field == 'related_links' and job_data.get('related_links'):
            
            for link_obj in job_data['related_links']:
                if isinstance(link_obj, dict) and 'link' in link_obj:
                    url = link_obj['link']
                    if is_valid_url(url):
                        return url
        else:
            url = job_data.get(field)
            if is_valid_url(url):
                return url
    title = job_data.get('title', '')
    company = job_data.get('company_name', '')
    if title and company:
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
                        "job_id": job.get("job_id"),  
                        "raw_data": job  
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

def parse_resume_with_gemini(model, resume_text):
    """
    Enhanced parsing with better prompt structure
    """
    prompt = f"""
    Please parse the following resume text and extract information into these sections.
    For each section, provide clean, structured output with proper formatting.
    
    IMPORTANT: Extract ALL information available, including:
    - All contact details (email, phone, LinkedIn, GitHub, portfolio links, address)
    - All education details (degree, university, GPA, graduation date, relevant coursework)
    - All technical skills (programming languages, frameworks, databases, tools)
    - All work experience with dates, company names, and detailed responsibilities
    - All projects with descriptions and technologies used
    - All certifications, awards, publications, and extra activities

    Format your response EXACTLY as follows:

    === PERSONAL_INFO ===
    [Full name on first line]
    [Email address]
    [Phone number]
    [Address if provided]
    [LinkedIn URL if provided]
    [GitHub URL if provided]
    [Portfolio/Website URL if provided]
    [Any other contact information]

    === EDUCATION ===
    [Degree] | [University/Institution] | [Graduation Date] | [GPA if provided]
    [Any additional education entries]
    [Relevant coursework if mentioned]

    === TECHNICAL_SKILLS ===
    Programming Languages: [list]
    Frameworks/Libraries: [list]
    Databases: [list]
    Tools/Technologies: [list]
    [Any other skill categories]

    === EXPERIENCE ===
    [Job Title] | [Company Name] | [Start Date - End Date]
    - [Responsibility/Achievement 1]
    - [Responsibility/Achievement 2]
    - [Continue for all responsibilities]

    [Next job entry following same format]

    === PROJECTS ===
    [Project Name] | [Technologies Used] | [Date if provided]
    - [Project description]
    - [Key features or achievements]
    - [Technical details]

    [Next project following same format]

    === CERTIFICATIONS_AWARDS ===
    [List all certifications, awards, publications, volunteer work, etc.]

    Resume text to parse:
    {resume_text}
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        st.error(f"Error processing with Gemini: {str(e)}")
        return None

def parse_gemini_output_to_dict(gemini_output):
    """
    Enhanced parsing of Gemini output with better section detection
    """
    parsed_data = {
        'PERSONAL_INFO': '',
        'EDUCATION': '',
        'TECHNICAL_SKILLS': '',
        'EXPERIENCE': '',
        'PROJECTS': '',
        'CERTIFICATIONS_AWARDS': ''
    }


    sections = re.split(r'=== ([A-Z_]+) ===', gemini_output)
    
    current_section = None
    for i, section in enumerate(sections):
        if section.strip() in parsed_data.keys():
            current_section = section.strip()
        elif current_section and i < len(sections):
            parsed_data[current_section] = section.strip()


    if not any(parsed_data.values()):
        lines = gemini_output.split('\n')
        current_section = None
        content_lines = []
        
        for line in lines:
            line = line.strip()
            if any(section in line.upper() for section in parsed_data.keys()):
                if current_section and content_lines:
                    parsed_data[current_section] = '\n'.join(content_lines)
                    content_lines = []
                for section in parsed_data.keys():
                    if section in line.upper():
                        current_section = section
                        break
            elif current_section and line:
                content_lines.append(line)
        
        if current_section and content_lines:
            parsed_data[current_section] = '\n'.join(content_lines)

    return parsed_data

def is_placeholder_text(text):
    """Check if text contains placeholder information that should be filtered out"""
    if not text or not text.strip():
        return True
    
    placeholder_indicators = [
        'not provided',
        'not specified',
        'not available',
        'n/a',
        '[', ']', 
        'none',
        'nil'
    ]
    
    text_lower = text.lower().strip()
    return any(indicator in text_lower for indicator in placeholder_indicators)

def clean_contact_info(contact_lines):
    """Clean and filter contact information, removing placeholder text"""
    cleaned_lines = []
    
    for line in contact_lines:
        line = line.strip()
        if not line or is_placeholder_text(line):
            continue
        

        if '|' in line:
            parts = [part.strip() for part in line.split('|')]
            valid_parts = [part for part in parts if not is_placeholder_text(part)]
            if valid_parts:
                cleaned_lines.extend(valid_parts)
        else:
            cleaned_lines.append(line)
    
    return cleaned_lines

def create_pdf_from_data(parsed_data):
    """
    Enhanced PDF generation with better formatting and spacing, filtering out placeholder text
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=0.75*inch, 
        leftMargin=0.75*inch,
        topMargin=0.75*inch, 
        bottomMargin=0.75*inch
    )

    styles = get_resume_styles()
    story = []


    personal_info = parsed_data.get('PERSONAL_INFO', '').strip()
    if personal_info:
        lines = [line.strip() for line in personal_info.split('\n') if line.strip()]
        if lines:

            name = lines[0]
            if not is_placeholder_text(name):
                story.append(Paragraph(name, styles['ResumeTitle']))
            

            contact_lines = lines[1:] if len(lines) > 1 else []
            cleaned_contact = clean_contact_info(contact_lines)
            
            if cleaned_contact:
                contact_info = " | ".join(cleaned_contact)
                story.append(Paragraph(contact_info, styles['ContactInfo']))


    sections_config = [
        ('EDUCATION', 'EDUCATION'),
        ('TECHNICAL_SKILLS', 'TECHNICAL SKILLS'),
        ('EXPERIENCE', 'PROFESSIONAL EXPERIENCE'),
        ('PROJECTS', 'PROJECTS'),
        ('CERTIFICATIONS_AWARDS', 'CERTIFICATIONS & AWARDS')
    ]

    for section_key, section_title in sections_config:
        content = parsed_data.get(section_key, '').strip()
        if content and not is_placeholder_text(content):

            story.append(Paragraph(section_title, styles['SectionHeading']))
            story.append(Spacer(1, 6))


            if section_key == 'TECHNICAL_SKILLS':

                lines = content.split('\n')
                valid_lines = []
                
                for line in lines:
                    line = line.strip()
                    if line and not is_placeholder_text(line):
                        if ':' in line:

                            category, skills = line.split(':', 1)
                            if not is_placeholder_text(skills.strip()):
                                valid_lines.append(f"<b>{category.strip()}:</b> {skills.strip()}")
                        else:
                            valid_lines.append(line)
                
                for valid_line in valid_lines:
                    story.append(Paragraph(valid_line, styles['Content']))

            elif section_key in ['EXPERIENCE', 'PROJECTS']:

                lines = content.split('\n')
                current_item = []
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    

                    if '|' in line and not line.startswith('-'):

                        if current_item:
                            _process_structured_item_filtered(current_item, story, styles)
                            current_item = []
                        current_item.append(line)
                    else:
                        current_item.append(line)
                

                if current_item:
                    _process_structured_item_filtered(current_item, story, styles)

            else:

                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and not is_placeholder_text(line):
                        if line.startswith('-') or line.startswith('•'):
                            story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
                        else:
                            story.append(Paragraph(line, styles['Content']))

            story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def _process_structured_item_filtered(item_lines, story, styles):
    """Helper function to process structured items like experience or projects, filtering placeholders"""
    if not item_lines:
        return
    

    header = item_lines[0]
    

    if '|' in header:
        header_parts = [part.strip() for part in header.split('|')]
        valid_parts = [part for part in header_parts if not is_placeholder_text(part)]
        if valid_parts:
            clean_header = ' | '.join(valid_parts)
            story.append(Paragraph(f"<b>{clean_header}</b>", styles['SubHeading']))
        else:
            return  
    else:
        if not is_placeholder_text(header):
            story.append(Paragraph(f"<b>{header}</b>", styles['SubHeading']))
        else:
            return  
    

    for line in item_lines[1:]:
        line = line.strip()
        if line and not is_placeholder_text(line):
            if line.startswith('-') or line.startswith('•'):
                story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
            else:
                story.append(Paragraph(line, styles['Content']))

def _process_structured_item(item_lines, story, styles):
    """Helper function to process structured items like experience or projects"""
    if not item_lines:
        return
    

    header = item_lines[0]
    story.append(Paragraph(f"<b>{header}</b>", styles['SubHeading']))
    

    for line in item_lines[1:]:
        line = line.strip()
        if line:
            if line.startswith('-') or line.startswith('•'):
                story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
            else:
                story.append(Paragraph(line, styles['Content']))

async def generate_tailored_pdf(resume_text: str, job_description: str, job_title: str, company_name: str):
    """
    Complete pipeline: Tailor resume -> Parse with Gemini -> Generate PDF
    """
    try:

        tailored_resume = await tailor_resume_with_llm(resume_text, job_description)
        if not tailored_resume:
            return None, "Failed to tailor resume"
        

        model = configure_gemini(GEMINI_API_KEY)
        if not model:
            return None, "Failed to configure Gemini"
        

        gemini_parsed_text = parse_resume_with_gemini(model, tailored_resume)
        if not gemini_parsed_text:
            return None, "Failed to parse resume with Gemini"
        

        parsed_data_dict = parse_gemini_output_to_dict(gemini_parsed_text)
        

        pdf_data = create_pdf_from_data(parsed_data_dict)
        if not pdf_data:
            return None, "Failed to generate PDF"
        

        company_clean = company_name.replace(' ', '_').replace('/', '-')
        job_title_clean = job_title.replace(' ', '_').replace('/', '-')
        filename = f"Tailored_Resume_{company_clean}_{job_title_clean}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return pdf_data, filename
        
    except Exception as e:
        return None, f"Error in PDF generation pipeline: {str(e)}"

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
st.markdown("Your AI-powered co-pilot for job hunting. Find jobs and generate tailored professional PDF resumes instantly.")

if 'jobs' not in st.session_state:
    st.session_state.jobs = []
if 'resume_text' not in st.session_state:
    st.session_state.resume_text = ""


if not SERPAPI_KEY or not GEMINI_API_KEY:
    st.error("❌ API keys not found. Please add `SERPAPI_KEY` and `GEMINI_API_KEY` to your .env file.")
    st.stop()

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
                st.text_area("Resume Content", st.session_state.resume_text, height=200, disabled=True, label_visibility="collapsed")

    find_jobs_button = st.button("Find Jobs", type="primary", use_container_width=True)

if find_jobs_button:
    if not all([job_title, location, experience, st.session_state.resume_text]):
        st.warning("Please fill in all fields (including experience) and upload your resume before searching.")
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
                    st.markdown(
                        f'<a href="{job_url}" target="_blank" style="text-decoration: none;">'
                        f'<div style="background-color: #0066cc; color: white; padding: 8px 16px; '
                        f'text-align: center; border-radius: 4px; font-weight: bold; cursor: pointer;">'
                        f'Apply Here</div></a>',
                        unsafe_allow_html=True
                    )
                else:
                    st.caption("❌ No link available")
            
            with st.expander("See Job Description & Generate Tailored Resume PDF"):
                st.markdown("### Job Description")
                st.markdown(job['description'])
                st.divider()
                
                col_action1, col_action2 = st.columns([3, 1])
                with col_action1:
                    if st.button("🎯 Generate Tailored Resume PDF", key=f"generate_pdf_{i}", use_container_width=True):
                        with st.spinner("🤖 AI is tailoring your resume and generating a professional PDF..."):
                            pdf_data, result = asyncio.run(
                                generate_tailored_pdf(
                                    st.session_state.resume_text, 
                                    job['description'],
                                    job['title'],
                                    job['company_name']
                                )
                            )
                            
                            if pdf_data:
                                st.session_state[f'pdf_{i}'] = pdf_data
                                st.session_state[f'filename_{i}'] = result
                                st.success("🎉 Professional PDF resume generated successfully!")
                                st.rerun()
                            else:
                                st.error(f"Failed to generate PDF: {result}")
                

                if st.session_state.get(f'pdf_{i}'):
                    with col_action2:
                        st.download_button(
                            label="📥 Download PDF Resume",
                            data=st.session_state[f'pdf_{i}'],
                            file_name=st.session_state[f'filename_{i}'],
                            mime="application/pdf",
                            key=f"download_{i}",
                            use_container_width=True
                        )


st.markdown("---")
st.markdown("### 🚀 HirePilot Features")
st.markdown("""
- **Smart Job Search**: Find relevant opportunities based on your experience
- **AI Resume Tailoring**: Automatically optimize your resume for each job
- **Professional PDF Generation**: Get beautifully formatted, ATS-friendly resumes
- **Direct Application**: Quick access to job application links
""")