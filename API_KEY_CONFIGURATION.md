# HirePilot - User-Configured API Keys

This update removes hardcoded API keys from the application and allows users to configure their own API keys through the frontend interface.

## Overview

Instead of storing API keys in environment variables on the server, users now provide their own API keys through a secure frontend configuration page. The keys are stored locally in the user's browser and sent with each API request.

## Features

- **Secure Local Storage**: API keys are stored in browser localStorage and never sent to our servers
- **User-Friendly Configuration**: Easy-to-use configuration page with clear instructions
- **Validation**: Comprehensive validation ensures users have the required keys before accessing features
- **Error Handling**: Clear error messages guide users when API keys are missing or invalid

## Required API Keys

### 1. SerpAPI Key
- **Purpose**: Powers job search functionality
- **Get it from**: [serpapi.com](https://serpapi.com/)
- **Steps**:
  1. Visit serpapi.com and sign up
  2. Go to your dashboard
  3. Copy your API key
  4. Paste it in the HirePilot configuration page

### 2. Google Gemini API Key
- **Purpose**: Powers AI-driven resume tailoring and parsing
- **Get it from**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Steps**:
  1. Visit Google AI Studio
  2. Sign in with your Google account
  3. Create a new API key
  4. Copy and paste it in the HirePilot configuration page

## Configuration

### Frontend Configuration Page
Access the API configuration at `/config` or via the "API Config" menu item.

Features:
- Secure password-like input fields with show/hide toggle
- Direct links to API provider signup pages
- Step-by-step instructions for each API key
- Local storage management (save/clear keys)
- Security notices and best practices

### API Key Validation
The application validates API keys before allowing access to features:
- Job search requires SerpAPI key
- Resume tailoring requires Gemini API key
- Clear error messages guide users to configuration page

## Security Considerations

### What's Secure
- ✅ API keys stored locally in user's browser only
- ✅ Keys never stored on our servers
- ✅ Direct communication with API providers
- ✅ Users maintain full control over their keys

### Best Practices for Users
- 🔐 Keep your API keys secure and don't share them
- 🔄 Rotate keys regularly as recommended by providers
- 🚫 Never commit API keys to version control
- 🗑️ Use the "Clear Keys" button if using a shared computer

## Usage Flow

1. **First Visit**: User is prompted to configure API keys
2. **Configuration**: User visits `/config` and enters their API keys
3. **Validation**: System validates keys are present before allowing feature access
4. **Usage**: User can now search jobs and tailor resumes using their own API quotas
5. **Management**: User can update or clear keys anytime via configuration page

## Error Handling

The application provides clear error messages for various scenarios:
- Missing API keys → Redirect to configuration page
- Invalid API keys → Display API provider error messages
- Network issues → Retry suggestions
- Quota exceeded → Explain limits and suggest key rotation

## Development Setup

### Environment Variables (No longer needed for API keys)
```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8003

# Backend - No API keys needed in environment
HOST=0.0.0.0
PORT=8003
```

### Running the Application
```bash
# Backend
cd backend
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Frontend  
cd frontend
npm install
npm run dev
```

### Testing
Users can test the configuration by:
1. Configuring API keys at `/config`
2. Uploading a resume and searching for jobs
3. Generating tailored resumes

## Benefits

### For Users
- 🎯 **Full Control**: Own your API usage and quotas
- 💰 **Cost Effective**: Pay only for what you use
- 🔒 **Privacy**: Your keys never leave your browser
- ⚡ **Performance**: Direct API calls, no proxy delays

### For Developers
- 🏗️ **Scalable**: No server-side API key management
- 💰 **Cost Efficient**: No API costs on our side
- 🛡️ **Secure**: No sensitive data on servers
- 🔧 **Maintainable**: Cleaner architecture

## Support

If users encounter issues:
1. Check API key configuration at `/config`
2. Verify keys are valid with the respective providers
3. Check browser console for detailed error messages
4. Clear and reconfigure keys if needed

## Migration from Environment Variables

For existing deployments, simply remove the `SERPAPI_KEY` and `GEMINI_API_KEY` environment variables. The application will automatically prompt users to configure their own keys.

---

This architecture provides a more scalable, secure, and user-controlled approach to API key management while maintaining all the functionality of the original application.
