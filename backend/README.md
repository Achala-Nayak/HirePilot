# HirePilot Backend API

AI-powered job search and resume tailoring service backend built with FastAPI.

## Features

- **Job Search**: Search for jobs using SerpApi Google Jobs API
- **Resume Tailoring**: AI-powered resume optimization for specific job postings
- **PDF Generation**: Professional PDF resume generation
- **Resume Parsing**: Extract structured data from resume text
- **File Upload**: Support for PDF resume uploads

## Tech Stack

- FastAPI (Python web framework)
- Google Gemini AI (for resume tailoring and parsing)
- SerpApi (for job search)
- ReportLab (for PDF generation)
- PyPDF2 (for PDF text extraction)
- Pydantic (for data validation)

## API Endpoints

### Job Search
- `POST /api/v1/jobs/search` - Search for jobs
- `GET /api/v1/jobs/health` - Job service health check
- `GET /api/v1/jobs/experience-levels` - Get available experience levels

### Resume Processing
- `POST /api/v1/resume/tailor` - Tailor resume for a specific job (text response)
- `POST /api/v1/resume/tailor-pdf` - Tailor resume and generate PDF
- `POST /api/v1/resume/upload-and-tailor-pdf` - Upload PDF, tailor, and generate new PDF
- `POST /api/v1/resume/parse` - Parse resume text into structured data
- `POST /api/v1/resume/extract-from-pdf` - Extract text from PDF resume
- `GET /api/v1/resume/health` - Resume service health check

### File Upload
- `POST /upload` - Upload resume with job search parameters

## Setup

### Prerequisites

- Python 3.12+
- uv (Python package manager)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HirePilot/backend
```

2. Install dependencies:
```bash
uv sync
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
SERPAPI_KEY=your_serpapi_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting API Keys

#### SerpApi Key
1. Go to [SerpApi](https://serpapi.com/)
2. Sign up for an account
3. Get your API key from the dashboard

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### Running the Server

Development mode:
```bash
uv run python main.py
```

Or with uvicorn directly:
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

The API will be available at:
- API: http://localhost:8003
- Documentation: http://localhost:8003/docs
- ReDoc: http://localhost:8003/redoc

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERPAPI_KEY` | API key for SerpApi job search | Yes |
| `GEMINI_API_KEY` | API key for Google Gemini AI | Yes |
| `HOST` | Host to bind the server (default: 0.0.0.0) | No |
| `PORT` | Port to run the server (default: 8003) | No |

## Usage Examples

### Search for Jobs

```bash
curl -X POST "http://localhost:8003/api/v1/jobs/search" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Software Engineer",
    "location": "San Francisco, CA",
    "experience": "mid level",
    "job_count": 10
  }'
```

### Tailor Resume

```bash
curl -X POST "http://localhost:8003/api/v1/resume/tailor" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume text here...",
    "job_description": "Job description here...",
    "job_title": "Software Engineer",
    "company_name": "Tech Company Inc"
  }'
```

### Upload and Tailor PDF Resume

```bash
curl -X POST "http://localhost:8003/api/v1/resume/upload-and-tailor-pdf" \
  -F "file=@/path/to/resume.pdf" \
  -F "job_description=Job description here..." \
  -F "job_title=Software Engineer" \
  -F "company_name=Tech Company Inc" \
  --output tailored_resume.pdf
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── models/
│   │   └── job_models.py          # Pydantic models
│   ├── routes/
│   │   ├── jobs.py                # Job search endpoints
│   │   ├── resume.py              # Resume processing endpoints
│   │   └── upload.py              # File upload endpoints
│   └── services/
│       ├── job_service.py         # Job search logic
│       └── resume_service.py      # Resume processing logic
├── uploads/                       # Uploaded files storage
├── main.py                        # FastAPI application
├── pyproject.toml                 # Dependencies
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid input data or file format
- **500 Internal Server Error**: Server-side errors (API failures, processing errors)

All error responses follow the standard format:
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "OPTIONAL_ERROR_CODE"
}
```

## Logging

The application uses Python's built-in logging module. Logs include:
- Request information
- API call details
- Error messages
- Processing status

## Security Considerations

- API keys are loaded from environment variables
- CORS is configured (update origins for production)
- File uploads are validated for PDF format
- Input validation using Pydantic models

## Production Deployment

For production deployment:

1. Update CORS origins in `main.py`
2. Use a production WSGI server like Gunicorn
3. Set up proper logging
4. Use environment-specific configuration
5. Implement rate limiting
6. Add authentication if needed

Example production command:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8003
```

## Development

### Running Tests

```bash
# Add your test commands here when tests are implemented
```

### Code Quality

The project follows Python best practices:
- Type hints
- Pydantic for data validation
- Structured logging
- Proper error handling
- Modular architecture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license information here]
