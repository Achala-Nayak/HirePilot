# HirePilot

🚀 **AI-Powered Job Search and Resume Optimization Platform**

HirePilot is an intelligent job search platform that combines advanced AI technology with automated resume tailoring to help job seekers find and apply for positions more effectively. The platform streamlines the job search process by automatically customizing resumes for specific job postings and providing comprehensive job search capabilities.

## 🌟 Features

### Core Functionality
- **Intelligent Job Search**: Advanced job discovery using SerpApi Google Jobs API with filters for location, experience level, and job type
- **AI-Powered Resume Tailoring**: Automatically optimize resumes for specific job postings using Google Gemini AI
- **Professional PDF Generation**: Create polished, ATS-friendly PDF resumes with custom formatting
- **Resume Analysis**: Parse and extract structured data from existing resumes
- **File Upload Support**: Upload PDF resumes for processing and optimization
- **Automation Integration**: Browserbase and StageHand integration for automated workflows

### Smart Optimization
- **ATS Compatibility**: Ensures resumes pass Applicant Tracking Systems
- **Keyword Optimization**: Automatically incorporates relevant job-specific keywords
- **Format Consistency**: Maintains professional formatting across all generated documents
- **Content Enhancement**: AI-driven improvements to resume content and structure

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14+ (App Router)
- React 18+ with TypeScript
- Tailwind CSS for styling
- Modern, responsive design

**Backend**
- FastAPI (Python 3.12+)
- Google Gemini AI for resume processing
- SerpApi for job search functionality
- ReportLab for PDF generation
- PyPDF2 for PDF text extraction
- Pydantic for data validation

**Additional Tools**
- Browserbase for browser automation
- StageHand for workflow automation

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- uv (Python package manager)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
uv sync
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```bash
SERPAPI_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Start the backend server:
```bash
uv run python main.py
```

The API will be available at http://localhost:8003

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at http://localhost:3000

## 📚 API Documentation

### Key Endpoints

**Job Search**
- `POST /api/v1/jobs/search` - Search for jobs with filters
- `GET /api/v1/jobs/health` - Service health check
- `GET /api/v1/jobs/experience-levels` - Available experience levels

**Resume Processing**
- `POST /api/v1/resume/tailor` - Tailor resume for specific job
- `POST /api/v1/resume/tailor-pdf` - Generate tailored PDF resume
- `POST /api/v1/resume/upload-and-tailor-pdf` - Upload and process PDF
- `POST /api/v1/resume/parse` - Extract structured data from resume
- `POST /api/v1/resume/extract-from-pdf` - Extract text from PDF

**File Management**
- `POST /upload` - Upload resume files

For detailed API documentation, visit http://localhost:8003/docs when running the backend.

## 🔧 Configuration

### Required API Keys

**SerpApi Key**
1. Visit [SerpApi](https://serpapi.com/)
2. Create an account and get your API key
3. Used for job search functionality

**Google Gemini API Key**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in and create a new API key
3. Used for AI-powered resume tailoring

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERPAPI_KEY` | SerpApi key for job searches | Yes |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `HOST` | Server host (default: 0.0.0.0) | No |
| `PORT` | Server port (default: 8003) | No |

## 🎯 Use Cases

### For Job Seekers
- **Efficient Application Process**: Quickly tailor resumes for multiple job applications
- **ATS Optimization**: Ensure resumes pass automated screening systems
- **Keyword Enhancement**: Automatically incorporate relevant industry keywords
- **Professional Formatting**: Generate consistently formatted, professional documents

### For Recruiters
- **Candidate Analysis**: Better understand candidate qualifications through parsed resume data
- **Streamlined Review**: Access structured candidate information for faster screening

### For Career Services
- **Bulk Processing**: Help multiple clients optimize their resumes efficiently
- **Consistency**: Ensure all client resumes meet professional standards
- **Analytics**: Track successful applications and optimization patterns

## 📁 Project Structure

```
HirePilot/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── models/            # Pydantic data models
│   │   ├── routes/            # API route handlers
│   │   └── services/          # Business logic
│   ├── uploads/               # File storage
│   ├── main.py               # FastAPI application
│   └── README.md             # Backend documentation
├── frontend/                  # Next.js frontend
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # Utility functions
│   └── package.json
├── Version1/                 # Legacy version
└── README.md                 # This file
```
## 🙏 Acknowledgments

- Google Gemini AI for powerful resume processing capabilities
- SerpApi for comprehensive job search functionality
- The open-source community for the amazing tools and libraries

---

**HirePilot** - Streamlining the job search process with AI-powered automation.