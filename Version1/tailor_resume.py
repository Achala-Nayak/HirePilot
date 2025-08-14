import streamlit as st
import google.generativeai as genai
import os
import io
import re
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.colors import black, darkblue
from reportlab.lib.units import inch
from datetime import datetime

# Load environment variables (for GEMINI_API_KEY)
load_dotenv()

# Configure Streamlit page
st.set_page_config(
    page_title="HirePilot Resume Generator",
    page_icon="📄",
    layout="wide"
)

@st.cache_resource
def configure_gemini(api_key):
    """Configure Gemini API and cache the model."""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
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

    # Split by section markers
    sections = re.split(r'=== ([A-Z_]+) ===', gemini_output)
    
    current_section = None
    for i, section in enumerate(sections):
        if section.strip() in parsed_data.keys():
            current_section = section.strip()
        elif current_section and i < len(sections):
            parsed_data[current_section] = section.strip()

    # Fallback parsing if the structured approach doesn't work
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

def create_pdf_from_data(parsed_data):
    """
    Enhanced PDF generation with better formatting and spacing
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

    # === HEADER SECTION ===
    personal_info = parsed_data.get('PERSONAL_INFO', '').strip()
    if personal_info:
        lines = [line.strip() for line in personal_info.split('\n') if line.strip()]
        if lines:
            # Name (first line)
            name = lines[0]
            story.append(Paragraph(name, styles['ResumeTitle']))
            
            # Contact information
            contact_lines = lines[1:] if len(lines) > 1 else []
            if contact_lines:
                contact_info = " | ".join(contact_lines)
                story.append(Paragraph(contact_info, styles['ContactInfo']))

    # === OTHER SECTIONS ===
    sections_config = [
        ('EDUCATION', 'EDUCATION'),
        ('TECHNICAL_SKILLS', 'TECHNICAL SKILLS'),
        ('EXPERIENCE', 'PROFESSIONAL EXPERIENCE'),
        ('PROJECTS', 'PROJECTS'),
        ('CERTIFICATIONS_AWARDS', 'CERTIFICATIONS & AWARDS')
    ]

    for section_key, section_title in sections_config:
        content = parsed_data.get(section_key, '').strip()
        if content and content.lower() != 'not specified':
            # Section heading
            story.append(Paragraph(section_title, styles['SectionHeading']))
            story.append(Spacer(1, 6))

            # Process content based on section type
            if section_key == 'TECHNICAL_SKILLS':
                # Handle technical skills with categories
                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line:
                        if ':' in line:
                            # Category: Skills format
                            category, skills = line.split(':', 1)
                            story.append(Paragraph(f"<b>{category.strip()}:</b> {skills.strip()}", styles['Content']))
                        else:
                            story.append(Paragraph(line, styles['Content']))

            elif section_key in ['EXPERIENCE', 'PROJECTS']:
                # Handle experience and projects with structured format
                lines = content.split('\n')
                current_item = []
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check if this is a new item (contains | or looks like a header)
                    if '|' in line and not line.startswith('-'):
                        # Process previous item if exists
                        if current_item:
                            _process_structured_item(current_item, story, styles)
                            current_item = []
                        current_item.append(line)
                    else:
                        current_item.append(line)
                
                # Process last item
                if current_item:
                    _process_structured_item(current_item, story, styles)

            else:
                # Handle other sections
                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line:
                        if line.startswith('-') or line.startswith('•'):
                            story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
                        else:
                            story.append(Paragraph(line, styles['Content']))

            story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def _process_structured_item(item_lines, story, styles):
    """Helper function to process structured items like experience or projects"""
    if not item_lines:
        return
    
    # First line is typically the header (title | company | dates)
    header = item_lines[0]
    story.append(Paragraph(f"<b>{header}</b>", styles['SubHeading']))
    
    # Remaining lines are details
    for line in item_lines[1:]:
        line = line.strip()
        if line:
            if line.startswith('-') or line.startswith('•'):
                story.append(Paragraph(f"• {line[1:].strip()}", styles['BulletPoint']))
            else:
                story.append(Paragraph(line, styles['Content']))

# Helper function defined at module level

def main():
    st.title("🚀 HirePilot Resume Generator")
    st.markdown("Convert your tailored resume text file into a professional PDF resume")

    # Load API key from environment
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        st.error("❌ Gemini API key not found in .env file. Please add `GEMINI_API_KEY` to your `.env` file.")
        st.stop()

    # Main content
    col1, col2 = st.columns([1, 1])

    with col1:
        st.header("📁 Upload Resume Text")

        # File upload
        uploaded_file = st.file_uploader(
            "Upload your tailored resume (.txt file)",
            type=['txt'],
            help="Upload the .txt file generated from HirePilot's tailor resume feature"
        )

        if uploaded_file is not None:
            # Read file content
            resume_text = uploaded_file.read().decode('utf-8')

            st.success("✅ File uploaded successfully!")

            # Show preview
            with st.expander("📖 Preview Resume Text"):
                st.text_area("Resume Content", resume_text, height=200, disabled=True)

    with col2:
        st.header("⚙️ Generate Resume")

        if uploaded_file is not None:
            if st.button("🎯 Generate Professional Resume PDF", type="primary"):
                with st.spinner("Processing resume with Gemini AI..."):
                    # Configure Gemini
                    model = configure_gemini(api_key)

                    if model:
                        # Parse resume with Gemini
                        gemini_parsed_text = parse_resume_with_gemini(model, resume_text)

                        if gemini_parsed_text:
                            st.success("✅ Resume parsed successfully by Gemini!")

                            # Show Gemini's parsed data preview
                            with st.expander("🔍 Gemini's Parsed Data"):
                                st.text(gemini_parsed_text)

                            # Parse Gemini's text output into a Python dictionary
                            parsed_data_dict = parse_gemini_output_to_dict(gemini_parsed_text)

                            # Show parsed sections for debugging
                            with st.expander("📊 Parsed Sections"):
                                for section, content in parsed_data_dict.items():
                                    if content:
                                        st.write(f"**{section}:**")
                                        st.text(content[:200] + "..." if len(content) > 200 else content)
                                        st.write("---")

                            # Convert to PDF using reportlab
                            with st.spinner("Generating PDF with ReportLab..."):
                                try:
                                    pdf_data = create_pdf_from_data(parsed_data_dict)

                                    if pdf_data:
                                        st.success("🎉 PDF generated successfully!")

                                        # Download button
                                        st.download_button(
                                            label="📥 Download Resume PDF",
                                            data=pdf_data,
                                            file_name=f"professional_resume_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                                            mime="application/pdf"
                                        )
                                    else:
                                        st.error("Failed to generate PDF.")
                                except Exception as e:
                                    st.error(f"Error during PDF generation: {str(e)}")
                                    st.exception(e)  # Show full traceback for debugging
                        else:
                            st.error("Gemini failed to parse the resume text.")
        else:
            st.warning("📁 Please upload a resume text file to begin.")

if __name__ == "__main__":
    main()