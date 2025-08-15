# HirePilot Chrome Extension

A Chrome extension that automatically applies to jobs with AI-tailored resumes.

## Features

- 🔍 **Job Detection**: Automatically detects job postings on major job sites
- 🤖 **AI Resume Tailoring**: Generates tailored resumes for each job using your HirePilot backend
- 🚀 **Auto-Apply**: Automatically fills out and submits job applications
- 📊 **Application Tracking**: Tracks all your applications and daily limits
- ⚙️ **Customizable Settings**: Configure application limits and automation level
- 👤 **Profile Management**: Store your personal information for quick form filling

## Supported Job Sites

- LinkedIn
- Indeed
- Glassdoor
- Google Jobs
- AngelList/Wellfound
- And more...

## Installation

### Development Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd /path/to/HirePilot/chrome-extension
   ```

2. **Open Chrome Extensions page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

4. **Pin the extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "HirePilot Auto Apply" and click the pin icon

### Setup Your Backend

Make sure your HirePilot backend is running:

```bash
cd /path/to/HirePilot/backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The extension expects the backend to be running at `http://localhost:8000`.

## Usage

### Initial Setup

1. **Click the extension icon** in your Chrome toolbar
2. **Configure your profile**:
   - Click "👤 Profile"
   - Fill in your personal information
   - Click "Save Profile"

3. **Adjust settings**:
   - Click "⚙️ Settings"
   - Set your daily application limit
   - Choose automation level
   - Save settings

### Auto-Applying to Jobs

1. **Navigate to a job posting** on any supported job site
2. **Click "🔍 Analyze Job"** in the extension popup or floating panel
3. **Wait for analysis** - the extension will extract job details and generate a tailored resume
4. **Click "🚀 Auto Apply"** to automatically fill and submit the application
5. **Monitor your applications** in the "Recent Applications" section

### Manual Mode

You can also use the extension manually:
- The floating panel appears on job sites automatically
- Use "Analyze Job" to just generate tailored content without applying
- Review generated resumes before applying

## Configuration

### Extension Settings

- **Max Applications per Day**: Limit how many applications you send daily (default: 10)
- **Auto-Apply Mode**: 
  - Manual: Requires confirmation for each application
  - Semi-automatic: Auto-fills forms but requires manual submission
  - Fully automatic: Completely automated application process

### Backend Configuration

Update the API URL in `background.js` if your backend runs on a different port:

```javascript
const API_BASE_URL = 'http://localhost:8000';  // Change this if needed
```

## Privacy & Security

- All personal data is stored locally in Chrome's secure storage
- No data is shared with third parties
- Resume content is generated using your own backend API
- Application tracking is optional and stored locally

## Troubleshooting

### Extension Not Working

1. **Check backend connection**:
   - Ensure your FastAPI backend is running
   - Check browser console for CORS errors
   - Verify API_BASE_URL in background.js

2. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Click the reload icon for HirePilot Auto Apply

3. **Check permissions**:
   - Ensure the extension has permissions for the job site you're using
   - Try refreshing the job page

### Job Not Detected

1. **Try manual analysis**:
   - Click "🔍 Analyze Job" in the extension popup
   - Check if job details are extracted correctly

2. **Supported sites**:
   - The extension works best on major job sites
   - Some custom job boards may not be supported

### Form Filling Issues

1. **Check profile data**:
   - Ensure your profile is complete in extension settings
   - Verify all required fields are filled

2. **Site-specific issues**:
   - Some sites may have anti-automation measures
   - Try the semi-automatic mode for better compatibility

## Development

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for background tasks
├── content-script.js      # Injected into job site pages
├── content-styles.css     # Styles for injected UI
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styles
└── icons/                # Extension icons
```

### Adding New Job Sites

To add support for a new job site:

1. **Add the domain** to `manifest.json` in `host_permissions` and `content_scripts.matches`
2. **Create an extraction function** in `content-script.js`:
   ```javascript
   extractNewSiteJobData() {
     // Extract job title, company, description, etc.
     return jobData;
   }
   ```
3. **Add to the site detection** in `detectJobSite()` method

### API Integration

The extension communicates with your backend through these endpoints:

- `POST /extension/analyze-job` - Analyze job and generate tailored resume
- `POST /extension/track-application` - Track application submissions
- `GET /extension/user-profile/{user_id}` - Get user profile data
- `POST /extension/generate-cover-letter` - Generate cover letters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on multiple job sites
5. Submit a pull request

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your backend is running and accessible
3. Try reloading the extension
4. Check if the job site is supported

For additional help, please open an issue in the GitHub repository.

## Legal Notice

This extension is for educational and personal use only. Always respect the terms of service of job sites you're applying through. Some sites may prohibit automated applications - use responsibly and ethically.

## Version History

- **v1.0**: Initial release with basic auto-apply functionality
- Support for LinkedIn, Indeed, Glassdoor, Google Jobs
- AI-powered resume tailoring
- Application tracking and limits
