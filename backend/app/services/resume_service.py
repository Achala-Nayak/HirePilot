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
    """Initialize and return a reportlab stylesheet with enhanced professional styles for 2-page layout."""
    styles = getSampleStyleSheet()

    custom_styles = {
        'ResumeTitle': ParagraphStyle(
            name='ResumeTitle',
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            spaceAfter=4,
            textColor=darkblue
        ),
        'ContactInfo': ParagraphStyle(
            name='ContactInfo',
            fontName='Helvetica',
            fontSize=9,
            leading=11,
            alignment=TA_CENTER,
            spaceAfter=16
        ),
        'ProfessionalSummary': ParagraphStyle(
            name='ProfessionalSummary',
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            alignment=TA_LEFT,
            spaceAfter=8,
            leftIndent=0,
            firstLineIndent=0
        ),
        'SectionHeading': ParagraphStyle(
            name='SectionHeading',
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=13,
            alignment=TA_LEFT,
            spaceBefore=10,
            spaceAfter=4,
            textColor=darkblue,
            borderWidth=1,
            borderColor=darkblue,
            borderPadding=1
        ),
        'SubSectionHeading': ParagraphStyle(
            name='SubSectionHeading',
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
            spaceBefore=6,
            spaceAfter=2,
            textColor=darkblue
        ),
        'Content': ParagraphStyle(
            name='Content',
            fontName='Helvetica',
            fontSize=9,
            leading=11,
            alignment=TA_LEFT,
            spaceAfter=3,
            leftIndent=0
        ),
        'SubHeading': ParagraphStyle(
            name='SubHeading',
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
            spaceAfter=2,
            spaceBefore=3
        ),
        'BulletPoint': ParagraphStyle(
            name='BulletPoint',
            fontName='Helvetica',
            fontSize=9,
            leading=11,
            alignment=TA_LEFT,
            leftIndent=12,
            bulletIndent=3,
            spaceAfter=2
        ),
        'CompetencyItem': ParagraphStyle(
            name='CompetencyItem',
            fontName='Helvetica',
            fontSize=9,
            leading=11,
            alignment=TA_LEFT,
            leftIndent=8,
            spaceAfter=2
        )
    }

    for style_name, style_obj in custom_styles.items():
        if style_name not in styles:
            styles.add(style_obj)
    return styles


async def tailor_resume_with_llm(resume_text: str, job_description: str) -> Optional[str]:
    """Use the Google Gemini API to tailor a resume for professional 2-page format with optimal section division."""
    prompt = f"""
    You are an expert ATS-optimized resume writer and senior career strategist specializing in creating high-impact, professional resumes. Your task is to craft an exceptional, executive-level resume that maximizes interview opportunities while maintaining a clean, professional 2-page format with strategically divided sections.

    **PREMIUM PROFESSIONAL REQUIREMENTS:**
    1. **2-Page Optimization**: Structure content to fit exactly 2 pages with balanced section distribution
    2. **Executive Presentation**: Use sophisticated language and executive-level terminology
    3. **Strategic Section Division**: Organize sections for maximum visual impact and readability
    4. **ATS & Human Optimization**: Balance keyword integration with compelling human readability
    5. **Professional Branding**: Create a cohesive personal brand throughout the document

    **ADVANCED CONTENT STRATEGY:**
    1. **Professional Summary/Profile**: Create a powerful 3-4 line executive summary highlighting unique value proposition
    2. **Core Competencies**: Curate 8-12 high-impact keywords and skills aligned with the target role
    3. **Professional Experience**: 
       - Prioritize most relevant and recent experiences
       - Use CAR (Challenge-Action-Result) format for bullet points
       - Quantify ALL achievements with specific metrics, percentages, dollar amounts
       - Focus on business impact and leadership accomplishments
    4. **Technical Proficiency**: Categorize technical skills by proficiency level
    5. **Education & Certifications**: Highlight relevant credentials prominently
    6. **Strategic Projects**: Showcase high-impact projects with measurable outcomes

    **EXECUTIVE WRITING STANDARDS:**
    - Use power verbs: Orchestrated, Spearheaded, Architected, Optimized, Revolutionized, Transformed
    - Emphasize leadership, strategy, and business impact over task descriptions
    - Include industry-specific terminology and technical jargon where appropriate
    - Demonstrate progression in responsibility and scope
    - Showcase cross-functional collaboration and stakeholder management
    - Highlight innovation, process improvement, and cost optimization

    **SECTION DISTRIBUTION FOR 2 PAGES:**
    Page 1: Contact Info, Professional Summary, Core Competencies, Primary Work Experience (2-3 most relevant roles)
    Page 2: Additional Experience, Technical Skills, Education, Certifications, Key Projects/Achievements

    **CONTENT ENHANCEMENT RULES:**
    - Transform basic job duties into strategic accomplishments
    - Use specific metrics: "Increased efficiency by 35%", "Reduced costs by $2.1M annually"
    - Incorporate industry buzzwords and trending technologies from the job description
    - Ensure each bullet point demonstrates value delivered to the organization
    - Use parallel structure and consistent formatting throughout
    - Optimize keyword density without compromising readability

    **QUALITY ASSURANCE:**
    - Executive-level language and tone throughout
    - Error-free grammar and professional presentation
    - Consistent formatting and spacing
    - Strategic use of white space for visual appeal
    - Professional typography and section hierarchy

    **Original Resume:**
    {resume_text}

    **Target Job Description:**
    {job_description}

    **Instructions:** Create a premium, executive-level tailored resume optimized for both ATS systems and human reviewers. Structure the content for professional 2-page layout with strategic section division. Return ONLY the complete tailored resume with no additional commentary. The output should represent the highest standard of professional resume writing.

    **Professional Tailored Resume:**
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
    """Enhanced parsing for professional resume structure with comprehensive section extraction."""
    prompt = f"""
    You are an expert resume parser specializing in extracting structured information from professional resumes. Parse the following resume text and organize it into clearly defined sections for optimal presentation in a professional 2-page format.

    **PARSING REQUIREMENTS:**
    1. Extract ALL available information with maximum detail
    2. Preserve professional language and executive-level terminology
    3. Maintain quantified achievements and specific metrics
    4. Organize content for strategic 2-page layout distribution
    5. Ensure comprehensive capture of technical skills and competencies

    **EXTRACTION GUIDELINES:**
    - Contact Details: Extract all professional contact information
    - Professional Summary: Capture any executive summary or professional profile
    - Core Competencies: Identify key skills and areas of expertise
    - Experience: Extract all work history with detailed accomplishments
    - Technical Skills: Categorize all technical proficiencies
    - Education: Include all academic credentials and relevant details
    - Certifications: Capture all professional certifications and awards
    - Projects: Extract significant projects with outcomes and technologies

    Format your response EXACTLY as follows:

    === PERSONAL_INFO ===
    [Full Name]
    [Email Address]
    [Phone Number]
    [Location/Address if provided]
    [LinkedIn Profile URL if provided]
    [GitHub/Portfolio URL if provided]
    [Professional Website if provided]
    [Any additional contact information]

    === PROFESSIONAL_SUMMARY ===
    [Executive summary or professional profile - capture the complete summary that positions the candidate as a senior professional]

    === CORE_COMPETENCIES ===
    [List of key competencies, skills, and areas of expertise - organize as bullet points or categories]

    === EDUCATION ===
    [Degree Type] | [Institution Name] | [Graduation Year/Date] | [GPA if mentioned] | [Honors/Distinctions]
    [Additional degrees following same format]
    [Relevant coursework or academic projects if significant]

    === TECHNICAL_SKILLS ===
    Programming Languages: [comprehensive list]
    Frameworks & Libraries: [comprehensive list]
    Databases & Data Technologies: [comprehensive list]
    Cloud Platforms & DevOps: [comprehensive list]
    Development Tools & IDEs: [comprehensive list]
    Operating Systems: [list if mentioned]
    Methodologies: [Agile, Scrum, etc. if mentioned]
    [Any other technical categories]

    === PROFESSIONAL_EXPERIENCE ===
    [Job Title] | [Company Name] | [Employment Period] | [Location if provided]
    - [Detailed achievement/responsibility with quantified results]
    - [Detailed achievement/responsibility with quantified results]
    - [Continue for all significant accomplishments - maintain executive language]

    [Next position following same format]

    === PROJECTS ===
    [Project Name] | [Technologies/Skills Used] | [Timeframe] | [Role/Context]
    - [Project description with business impact]
    - [Key technical achievements and outcomes]
    - [Quantified results and metrics]

    [Next project following same format]

    === CERTIFICATIONS_AWARDS ===
    [Professional certifications with issuing organization and date]
    [Industry awards and recognitions]
    [Publications, patents, or thought leadership]
    [Volunteer work or community involvement if professionally relevant]
    [Professional memberships and affiliations]

    **IMPORTANT NOTES:**
    - Preserve ALL quantified achievements (percentages, dollar amounts, timelines)
    - Maintain executive-level language and professional terminology
    - Extract complete bullet points without truncation
    - Include all technical skills and competencies mentioned
    - Capture industry-specific keywords and terminology
    - Preserve action verbs and impact-focused language

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
    """Enhanced parsing of Gemini output with better section detection for professional resume structure."""
    parsed_data = {
        'PERSONAL_INFO': '',
        'PROFESSIONAL_SUMMARY': '',
        'CORE_COMPETENCIES': '',
        'EDUCATION': '',
        'TECHNICAL_SKILLS': '',
        'PROFESSIONAL_EXPERIENCE': '',
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
    """Enhanced helper function to process structured items with professional formatting."""
    if not item_lines:
        return
    
    # Process header with enhanced formatting
    header = item_lines[0]
    
    # Handle pipe-separated headers for professional presentation
    if '|' in header:
        header_parts = [part.strip() for part in header.split('|')]
        valid_parts = [part for part in header_parts if not is_placeholder_text(part)]
        if valid_parts:
            # Format as: Title | Company | Date
            if len(valid_parts) >= 2:
                # Bold title, regular company and date
                formatted_header = f"<b>{valid_parts[0]}</b>"
                if len(valid_parts) > 1:
                    formatted_header += f" | {valid_parts[1]}"
                if len(valid_parts) > 2:
                    formatted_header += f" | <i>{valid_parts[2]}</i>"
                story.append(Paragraph(formatted_header, styles['SubHeading']))
            else:
                story.append(Paragraph(f"<b>{valid_parts[0]}</b>", styles['SubHeading']))
        else:
            return  # Skip if no valid parts
    else:
        if not is_placeholder_text(header):
            story.append(Paragraph(f"<b>{header}</b>", styles['SubHeading']))
        else:
            return  # Skip if header is placeholder
    
    # Process content lines with enhanced bullet formatting
    for line in item_lines[1:]:
        line = line.strip()
        if line and not is_placeholder_text(line):
            if line.startswith('-') or line.startswith('•'):
                # Remove existing bullet and add professional bullet
                clean_line = line[1:].strip()
                story.append(Paragraph(f"• {clean_line}", styles['BulletPoint']))
            else:
                # Add bullet to non-bulleted content lines
                story.append(Paragraph(f"• {line}", styles['BulletPoint']))
    
    # Add small spacer after each item for better separation
    story.append(Spacer(1, 4))


def create_pdf_from_data(parsed_data: Dict[str, str]) -> bytes:
    """Enhanced PDF generation with professional 2-page layout and premium formatting."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=0.65*inch, 
        leftMargin=0.65*inch,
        topMargin=0.6*inch, 
        bottomMargin=0.6*inch
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

    # Professional Summary
    prof_summary = parsed_data.get('PROFESSIONAL_SUMMARY', '').strip()
    if prof_summary and not is_placeholder_text(prof_summary):
        story.append(Paragraph('PROFESSIONAL SUMMARY', styles['SectionHeading']))
        story.append(Spacer(1, 3))
        
        # Handle multi-line professional summary
        summary_lines = prof_summary.split('\n')
        for line in summary_lines:
            line = line.strip()
            if line and not is_placeholder_text(line):
                story.append(Paragraph(line, styles['ProfessionalSummary']))
        story.append(Spacer(1, 8))

    # Core Competencies
    competencies = parsed_data.get('CORE_COMPETENCIES', '').strip()
    if competencies and not is_placeholder_text(competencies):
        story.append(Paragraph('CORE COMPETENCIES', styles['SectionHeading']))
        story.append(Spacer(1, 3))
        
        lines = competencies.split('\n')
        for line in lines:
            line = line.strip()
            if line and not is_placeholder_text(line):
                if line.startswith('-') or line.startswith('•'):
                    story.append(Paragraph(f"• {line[1:].strip()}", styles['CompetencyItem']))
                else:
                    story.append(Paragraph(f"• {line}", styles['CompetencyItem']))
        story.append(Spacer(1, 8))

    # Section configuration for professional layout
    sections_config = [
        ('PROFESSIONAL_EXPERIENCE', 'PROFESSIONAL EXPERIENCE'),
        ('TECHNICAL_SKILLS', 'TECHNICAL EXPERTISE'),
        ('EDUCATION', 'EDUCATION'),
        ('PROJECTS', 'KEY PROJECTS'),
        ('CERTIFICATIONS_AWARDS', 'CERTIFICATIONS & ACHIEVEMENTS')
    ]

    for section_key, section_title in sections_config:
        content = parsed_data.get(section_key, '').strip()
        if content and not is_placeholder_text(content):
            # Section header
            story.append(Paragraph(section_title, styles['SectionHeading']))
            story.append(Spacer(1, 3))

            # Section content with enhanced formatting
            if section_key == 'TECHNICAL_SKILLS':
                # Handle technical skills with professional categorization
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

            elif section_key in ['PROFESSIONAL_EXPERIENCE', 'PROJECTS']:
                # Handle structured sections with enhanced professional formatting
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

            elif section_key == 'EDUCATION':
                # Enhanced education formatting
                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and not is_placeholder_text(line):
                        if '|' in line:
                            # Format: Degree | Institution | Date | Additional Info
                            parts = [part.strip() for part in line.split('|')]
                            valid_parts = [part for part in parts if not is_placeholder_text(part)]
                            if valid_parts:
                                if len(valid_parts) >= 2:
                                    # Format as: Degree, Institution (Date)
                                    formatted_line = f"<b>{valid_parts[0]}</b>, {valid_parts[1]}"
                                    if len(valid_parts) > 2:
                                        formatted_line += f" ({valid_parts[2]})"
                                    story.append(Paragraph(formatted_line, styles['Content']))
                                else:
                                    story.append(Paragraph(line, styles['Content']))
                        else:
                            story.append(Paragraph(line, styles['Content']))

            else:
                # Handle other sections with professional formatting
                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and not is_placeholder_text(line):
                        if line.startswith('-') or line.startswith('•'):
                            story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
                        else:
                            story.append(Paragraph(line, styles['Content']))

            story.append(Spacer(1, 8))

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
