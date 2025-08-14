import os
import re
import io
from datetime import datetime
from typing import Dict, Optional, Tuple
import httpx
import google.generativeai as genai
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.colors import darkblue
from reportlab.lib.units import inch
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")


def configure_gemini() -> Optional[genai.GenerativeModel]:
    """Configure Gemini API and return the model."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        return model
    except Exception as e:
        logger.error(f"Error configuring Gemini: {str(e)}")
        return None


def get_resume_styles():
    """Initialize and return a reportlab stylesheet with custom styles."""
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


async def tailor_resume_with_llm(resume_text: str, job_description: str) -> Optional[str]:
    """Use the Google Gemini API to tailor a resume while maintaining original structure."""
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
    gemini_api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GEMINI_API_KEY}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(gemini_api_url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            if result.get("candidates") and result["candidates"][0].get("content"):
                return result["candidates"][0]["content"]["parts"][0]["text"].strip()
            else:
                logger.error("The API response was successful but did not contain the expected content.")
                return None
        except httpx.HTTPStatusError as e:
            logger.error(f"API Error: Failed to tailor resume. Status: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"An unexpected error occurred during resume tailoring: {e}")
            return None


def parse_resume_with_gemini(model: genai.GenerativeModel, resume_text: str) -> Optional[str]:
    """Enhanced parsing with better prompt structure."""
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
        logger.error(f"Error processing with Gemini: {str(e)}")
        return None


def parse_gemini_output_to_dict(gemini_output: str) -> Dict[str, str]:
    """Enhanced parsing of Gemini output with better section detection."""
    parsed_data = {
        'PERSONAL_INFO': '',
        'EDUCATION': '',
        'TECHNICAL_SKILLS': '',
        'EXPERIENCE': '',
        'PROJECTS': '',
        'CERTIFICATIONS_AWARDS': ''
    }

    # Split by section headers
    sections = re.split(r'=== ([A-Z_]+) ===', gemini_output)
    
    current_section = None
    for i, section in enumerate(sections):
        if section.strip() in parsed_data.keys():
            current_section = section.strip()
        elif current_section and i < len(sections):
            parsed_data[current_section] = section.strip()

    # Fallback parsing if the regex doesn't work
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


def is_placeholder_text(text: str) -> bool:
    """Check if text contains placeholder information that should be filtered out."""
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


def clean_contact_info(contact_lines: list) -> list:
    """Clean and filter contact information, removing placeholder text."""
    cleaned_lines = []
    
    for line in contact_lines:
        line = line.strip()
        if not line or is_placeholder_text(line):
            continue
        
        # Handle lines with pipe separators
        if '|' in line:
            parts = [part.strip() for part in line.split('|')]
            valid_parts = [part for part in parts if not is_placeholder_text(part)]
            if valid_parts:
                cleaned_lines.extend(valid_parts)
        else:
            cleaned_lines.append(line)
    
    return cleaned_lines


def _process_structured_item_filtered(item_lines: list, story: list, styles):
    """Helper function to process structured items like experience or projects, filtering placeholders."""
    if not item_lines:
        return
    
    # Process header
    header = item_lines[0]
    
    # Handle pipe-separated headers
    if '|' in header:
        header_parts = [part.strip() for part in header.split('|')]
        valid_parts = [part for part in header_parts if not is_placeholder_text(part)]
        if valid_parts:
            clean_header = ' | '.join(valid_parts)
            story.append(Paragraph(f"<b>{clean_header}</b>", styles['SubHeading']))
        else:
            return  # Skip if no valid parts
    else:
        if not is_placeholder_text(header):
            story.append(Paragraph(f"<b>{header}</b>", styles['SubHeading']))
        else:
            return  # Skip if header is placeholder
    
    # Process content lines
    for line in item_lines[1:]:
        line = line.strip()
        if line and not is_placeholder_text(line):
            if line.startswith('-') or line.startswith('•'):
                story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
            else:
                story.append(Paragraph(line, styles['Content']))


def create_pdf_from_data(parsed_data: Dict[str, str]) -> bytes:
    """Enhanced PDF generation with better formatting and spacing, filtering out placeholder text."""
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

    # Personal Information
    personal_info = parsed_data.get('PERSONAL_INFO', '').strip()
    if personal_info:
        lines = [line.strip() for line in personal_info.split('\n') if line.strip()]
        if lines:
            # Name (first line)
            name = lines[0]
            if not is_placeholder_text(name):
                story.append(Paragraph(name, styles['ResumeTitle']))
            
            # Contact information (remaining lines)
            contact_lines = lines[1:] if len(lines) > 1 else []
            cleaned_contact = clean_contact_info(contact_lines)
            
            if cleaned_contact:
                contact_info = " | ".join(cleaned_contact)
                story.append(Paragraph(contact_info, styles['ContactInfo']))

    # Section configuration
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
            # Section header
            story.append(Paragraph(section_title, styles['SectionHeading']))
            story.append(Spacer(1, 6))

            # Section content
            if section_key == 'TECHNICAL_SKILLS':
                # Handle technical skills with categories
                lines = content.split('\n')
                valid_lines = []
                
                for line in lines:
                    line = line.strip()
                    if line and not is_placeholder_text(line):
                        if ':' in line:
                            # Category: skills format
                            category, skills = line.split(':', 1)
                            if not is_placeholder_text(skills.strip()):
                                valid_lines.append(f"<b>{category.strip()}:</b> {skills.strip()}")
                        else:
                            valid_lines.append(line)
                
                for valid_line in valid_lines:
                    story.append(Paragraph(valid_line, styles['Content']))

            elif section_key in ['EXPERIENCE', 'PROJECTS']:
                # Handle structured sections with headers and bullet points
                lines = content.split('\n')
                current_item = []
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check if this is a new item header (contains | and doesn't start with -)
                    if '|' in line and not line.startswith('-'):
                        # Process previous item if exists
                        if current_item:
                            _process_structured_item_filtered(current_item, story, styles)
                            current_item = []
                        current_item.append(line)
                    else:
                        current_item.append(line)
                
                # Process last item
                if current_item:
                    _process_structured_item_filtered(current_item, story, styles)

            else:
                # Handle other sections
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


async def generate_tailored_pdf(
    resume_text: str, 
    job_description: str, 
    job_title: str, 
    company_name: str
) -> Tuple[Optional[bytes], str]:
    """Complete pipeline: Tailor resume -> Parse with Gemini -> Generate PDF."""
    try:
        # Step 1: Tailor resume
        tailored_resume = await tailor_resume_with_llm(resume_text, job_description)
        if not tailored_resume:
            return None, "Failed to tailor resume"
        
        # Step 2: Configure Gemini
        model = configure_gemini()
        if not model:
            return None, "Failed to configure Gemini"
        
        # Step 3: Parse tailored resume
        gemini_parsed_text = parse_resume_with_gemini(model, tailored_resume)
        if not gemini_parsed_text:
            return None, "Failed to parse resume with Gemini"
        
        # Step 4: Convert to structured data
        parsed_data_dict = parse_gemini_output_to_dict(gemini_parsed_text)
        
        # Step 5: Generate PDF
        pdf_data = create_pdf_from_data(parsed_data_dict)
        if not pdf_data:
            return None, "Failed to generate PDF"
        
        # Step 6: Generate filename
        company_clean = company_name.replace(' ', '_').replace('/', '-')
        job_title_clean = job_title.replace(' ', '_').replace('/', '-')
        filename = f"Tailored_Resume_{company_clean}_{job_title_clean}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return pdf_data, filename
        
    except Exception as e:
        logger.error(f"Error in PDF generation pipeline: {str(e)}")
        return None, f"Error in PDF generation pipeline: {str(e)}"


async def parse_resume_only(resume_text: str) -> Tuple[Optional[Dict[str, str]], str]:
    """Parse resume text into structured data without tailoring."""
    try:
        # Configure Gemini
        model = configure_gemini()
        if not model:
            return None, "Failed to configure Gemini"
        
        # Parse resume
        gemini_parsed_text = parse_resume_with_gemini(model, resume_text)
        if not gemini_parsed_text:
            return None, "Failed to parse resume with Gemini"
        
        # Convert to structured data
        parsed_data_dict = parse_gemini_output_to_dict(gemini_parsed_text)
        
        return parsed_data_dict, "Resume parsed successfully"
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        return None, f"Error parsing resume: {str(e)}"
