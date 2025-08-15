// Background Service Worker for HirePilot Auto Apply Extension

const API_BASE_URL = 'http://localhost:8000';  // Your FastAPI backend URL

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('HirePilot Auto Apply extension installed');
  
  // Initialize default settings
  chrome.storage.sync.set({
    autoApplyEnabled: false,
    maxApplicationsPerDay: 10,
    applicationsToday: 0,
    lastApplicationDate: new Date().toDateString(),
    userProfile: null,
    resumeData: null
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getJobDescription':
      handleJobDescriptionExtraction(message.data, sendResponse);
      return true; // Will respond asynchronously
      
    case 'generateTailoredResume':
      generateTailoredResume(message.jobDescription, sendResponse);
      return true;
      
    case 'autoFillApplication':
      handleAutoFillApplication(message.data, sendResponse);
      return true;
      
    case 'trackApplication':
      trackApplicationSubmission(message.data, sendResponse);
      return true;
      
    case 'getSettings':
      getExtensionSettings(sendResponse);
      return true;
      
    case 'updateSettings':
      updateExtensionSettings(message.data, sendResponse);
      return true;
  }
});

// Extract job description and generate tailored resume
async function handleJobDescriptionExtraction(jobData, sendResponse) {
  try {
    // Get current settings
    const settings = await chrome.storage.sync.get([
      'autoApplyEnabled', 
      'maxApplicationsPerDay', 
      'applicationsToday',
      'lastApplicationDate'
    ]);
    
    // Check if auto-apply is enabled and within limits
    if (!settings.autoApplyEnabled) {
      sendResponse({ success: false, error: 'Auto-apply is disabled' });
      return;
    }
    
    // Reset daily counter if it's a new day
    const today = new Date().toDateString();
    if (settings.lastApplicationDate !== today) {
      await chrome.storage.sync.set({
        applicationsToday: 0,
        lastApplicationDate: today
      });
      settings.applicationsToday = 0;
    }
    
    // Check daily application limit
    if (settings.applicationsToday >= settings.maxApplicationsPerDay) {
      sendResponse({ 
        success: false, 
        error: `Daily application limit reached (${settings.maxApplicationsPerDay})` 
      });
      return;
    }
    
    // Generate tailored resume
    const tailoredResume = await generateTailoredResume(jobData);
    
    sendResponse({ 
      success: true, 
      tailoredResume: tailoredResume,
      canApply: true
    });
    
  } catch (error) {
    console.error('Error handling job description:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Generate tailored resume using your backend API
async function generateTailoredResume(jobData) {
  try {
    const response = await fetch(`${API_BASE_URL}/extension/analyze-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_description: jobData.description || '',
        job_title: jobData.title || 'Unknown',
        company: jobData.company || 'Unknown',
        location: jobData.location || '',
        url: jobData.url || '',
        site: jobData.site || 'unknown'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tailored_resume;
    
  } catch (error) {
    console.error('Error generating tailored resume:', error);
    throw error;
  }
}

// Handle auto-fill application form
async function handleAutoFillApplication(applicationData, sendResponse) {
  try {
    // Store application data for tracking
    const applicationRecord = {
      jobTitle: applicationData.jobTitle,
      company: applicationData.company,
      url: applicationData.url,
      appliedAt: new Date().toISOString(),
      status: 'applied'
    };
    
    // Update application counter
    const settings = await chrome.storage.sync.get(['applicationsToday']);
    await chrome.storage.sync.set({
      applicationsToday: (settings.applicationsToday || 0) + 1
    });
    
    // Store application record
    let applications = await chrome.storage.local.get(['applications']);
    applications = applications.applications || [];
    applications.push(applicationRecord);
    await chrome.storage.local.set({ applications });
    
    sendResponse({ success: true, applicationRecord });
    
  } catch (error) {
    console.error('Error handling auto-fill application:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Track application submission
async function trackApplicationSubmission(data, sendResponse) {
  try {
    // You can integrate with your backend to track applications
    const response = await fetch(`${API_BASE_URL}/extension/track-application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    sendResponse({ success: response.ok });
    
  } catch (error) {
    console.error('Error tracking application:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get extension settings
async function getExtensionSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'autoApplyEnabled',
      'maxApplicationsPerDay',
      'applicationsToday',
      'userProfile'
    ]);
    
    sendResponse({ success: true, settings });
    
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Update extension settings
async function updateExtensionSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.sync.set(newSettings);
    sendResponse({ success: true });
    
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
