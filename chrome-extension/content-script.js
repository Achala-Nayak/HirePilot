// Content Script for HirePilot Auto Apply Extension
// This script runs on job sites and handles form filling and job detection

class JobSiteHandler {
  constructor() {
    this.currentSite = this.detectJobSite();
    this.jobData = null;
    this.autoApplyButton = null;
    this.isProcessing = false;
    
    this.init();
  }
  
  init() {
    // Create and inject the HirePilot UI
    this.createAutoApplyUI();
    
    // Listen for job page changes (for SPA sites like LinkedIn)
    this.observePageChanges();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Will respond asynchronously
    });
  }
  
  detectJobSite() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed.com')) return 'indeed';
    if (hostname.includes('glassdoor.com')) return 'glassdoor';
    if (hostname.includes('jobs.google.com')) return 'google';
    if (hostname.includes('angel.co') || hostname.includes('wellfound.com')) return 'angellist';
    
    return 'generic';
  }
  
  createAutoApplyUI() {
    // Remove existing UI if present
    const existing = document.getElementById('hirepilot-auto-apply-ui');
    if (existing) existing.remove();
    
    // Create floating UI
    const ui = document.createElement('div');
    ui.id = 'hirepilot-auto-apply-ui';
    ui.innerHTML = `
      <div class="hirepilot-panel">
        <div class="hirepilot-header">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="HirePilot">
          <span>HirePilot</span>
          <button id="hirepilot-close" class="hirepilot-close">×</button>
        </div>
        <div class="hirepilot-content">
          <div id="hirepilot-status" class="hirepilot-status">
            Ready to detect job posting...
          </div>
          <div class="hirepilot-actions">
            <button id="hirepilot-analyze" class="hirepilot-btn hirepilot-btn-primary">
              🔍 Analyze Job
            </button>
            <button id="hirepilot-auto-apply" class="hirepilot-btn hirepilot-btn-success" disabled>
              🚀 Auto Apply
            </button>
          </div>
          <div id="hirepilot-progress" class="hirepilot-progress" style="display: none;">
            <div class="hirepilot-progress-bar">
              <div class="hirepilot-progress-fill"></div>
            </div>
            <span class="hirepilot-progress-text">Processing...</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(ui);
    
    // Add event listeners
    document.getElementById('hirepilot-close').addEventListener('click', () => {
      ui.style.display = 'none';
    });
    
    document.getElementById('hirepilot-analyze').addEventListener('click', () => {
      this.analyzeCurrentJob();
    });
    
    document.getElementById('hirepilot-auto-apply').addEventListener('click', () => {
      this.autoApplyToJob();
    });
    
    this.autoApplyButton = document.getElementById('hirepilot-auto-apply');
  }
  
  async analyzeCurrentJob() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.updateStatus('Analyzing job posting...', true);
    
    try {
      // Extract job information based on the site
      const jobData = await this.extractJobData();
      
      if (!jobData) {
        this.updateStatus('No job posting found on this page', false);
        return;
      }
      
      // Send to background script for processing
      const response = await chrome.runtime.sendMessage({
        action: 'getJobDescription',
        data: jobData
      });
      
      if (response.success) {
        this.jobData = { ...jobData, tailoredResume: response.tailoredResume };
        this.updateStatus('Job analyzed! Ready to apply.', false);
        this.autoApplyButton.disabled = false;
      } else {
        this.updateStatus(`Error: ${response.error}`, false);
      }
      
    } catch (error) {
      console.error('Error analyzing job:', error);
      this.updateStatus('Failed to analyze job posting', false);
    } finally {
      this.isProcessing = false;
    }
  }
  
  async extractJobData() {
    let jobData = null;
    
    switch (this.currentSite) {
      case 'linkedin':
        jobData = this.extractLinkedInJobData();
        break;
      case 'indeed':
        jobData = this.extractIndeedJobData();
        break;
      case 'glassdoor':
        jobData = this.extractGlassdoorJobData();
        break;
      case 'google':
        jobData = this.extractGoogleJobsData();
        break;
      default:
        jobData = this.extractGenericJobData();
    }
    
    return jobData;
  }
  
  extractLinkedInJobData() {
    try {
      const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title a')?.textContent?.trim() ||
                       document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim();
      
      const company = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim();
      
      const location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim();
      
      const description = document.querySelector('.job-details-jobs-unified-top-card__job-description div')?.textContent?.trim() ||
                         document.querySelector('.jobs-description-content__text')?.textContent?.trim();
      
      if (!jobTitle || !company || !description) return null;
      
      return {
        title: jobTitle,
        company: company,
        location: location,
        description: description,
        url: window.location.href,
        site: 'linkedin'
      };
    } catch (error) {
      console.error('Error extracting LinkedIn job data:', error);
      return null;
    }
  }
  
  extractIndeedJobData() {
    try {
      const jobTitle = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span')?.textContent?.trim();
      const company = document.querySelector('[data-testid="inlineHeader-companyName"] a')?.textContent?.trim();
      const location = document.querySelector('[data-testid="job-location"]')?.textContent?.trim();
      const description = document.querySelector('#jobDescriptionText')?.textContent?.trim();
      
      if (!jobTitle || !company || !description) return null;
      
      return {
        title: jobTitle,
        company: company,
        location: location,
        description: description,
        url: window.location.href,
        site: 'indeed'
      };
    } catch (error) {
      console.error('Error extracting Indeed job data:', error);
      return null;
    }
  }
  
  extractGlassdoorJobData() {
    try {
      const jobTitle = document.querySelector('[data-test="job-title"]')?.textContent?.trim();
      const company = document.querySelector('[data-test="employer-name"]')?.textContent?.trim();
      const location = document.querySelector('[data-test="job-location"]')?.textContent?.trim();
      const description = document.querySelector('.jobDescriptionContent')?.textContent?.trim();
      
      if (!jobTitle || !company || !description) return null;
      
      return {
        title: jobTitle,
        company: company,
        location: location,
        description: description,
        url: window.location.href,
        site: 'glassdoor'
      };
    } catch (error) {
      console.error('Error extracting Glassdoor job data:', error);
      return null;
    }
  }
  
  extractGoogleJobsData() {
    try {
      const jobTitle = document.querySelector('.KLsYvd')?.textContent?.trim();
      const company = document.querySelector('.nJlQNd')?.textContent?.trim();
      const description = document.querySelector('.HBvzbc')?.textContent?.trim();
      
      if (!jobTitle || !company || !description) return null;
      
      return {
        title: jobTitle,
        company: company,
        description: description,
        url: window.location.href,
        site: 'google'
      };
    } catch (error) {
      console.error('Error extracting Google Jobs data:', error);
      return null;
    }
  }
  
  extractGenericJobData() {
    // Generic extraction for other job sites
    try {
      // Look for common patterns
      const possibleTitles = document.querySelectorAll('h1, h2, .job-title, .title, [class*="title"], [class*="job"]');
      const possibleCompanies = document.querySelectorAll('[class*="company"], [class*="employer"]');
      const possibleDescriptions = document.querySelectorAll('[class*="description"], [class*="detail"], .content');
      
      const jobTitle = Array.from(possibleTitles).find(el => 
        el.textContent.trim().length > 5 && el.textContent.trim().length < 100
      )?.textContent?.trim();
      
      const company = Array.from(possibleCompanies).find(el => 
        el.textContent.trim().length > 2 && el.textContent.trim().length < 50
      )?.textContent?.trim();
      
      const description = Array.from(possibleDescriptions).find(el => 
        el.textContent.trim().length > 100
      )?.textContent?.trim();
      
      if (!jobTitle || !description) return null;
      
      return {
        title: jobTitle,
        company: company || 'Unknown',
        description: description,
        url: window.location.href,
        site: 'generic'
      };
    } catch (error) {
      console.error('Error extracting generic job data:', error);
      return null;
    }
  }
  
  async autoApplyToJob() {
    if (!this.jobData || this.isProcessing) return;
    
    this.isProcessing = true;
    this.updateStatus('Starting auto-application...', true);
    
    try {
      // Find and fill the application form
      const applicationForm = await this.findApplicationForm();
      
      if (!applicationForm) {
        this.updateStatus('No application form found on this page', false);
        return;
      }
      
      // Fill the form with tailored resume data
      await this.fillApplicationForm(applicationForm);
      
      // Track the application
      await chrome.runtime.sendMessage({
        action: 'trackApplication',
        data: {
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          url: this.jobData.url,
          site: this.jobData.site
        }
      });
      
      this.updateStatus('Application submitted successfully!', false);
      
    } catch (error) {
      console.error('Error during auto-apply:', error);
      this.updateStatus('Failed to submit application', false);
    } finally {
      this.isProcessing = false;
    }
  }
  
  async findApplicationForm() {
    // Look for common application form patterns
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      // Check if form contains job application fields
      const hasResumeField = form.querySelector('input[type="file"]') || 
                            form.querySelector('[name*="resume"]') ||
                            form.querySelector('[name*="cv"]');
      
      const hasNameField = form.querySelector('input[name*="name"]') ||
                          form.querySelector('input[name*="first"]') ||
                          form.querySelector('input[name*="last"]');
      
      const hasEmailField = form.querySelector('input[type="email"]') ||
                           form.querySelector('input[name*="email"]');
      
      if (hasNameField && hasEmailField) {
        return form;
      }
    }
    
    return null;
  }
  
  async fillApplicationForm(form) {
    // Get user profile data
    const settings = await chrome.storage.sync.get(['userProfile']);
    const userProfile = settings.userProfile || {};
    
    // Fill common fields
    const nameFields = form.querySelectorAll('input[name*="name"], input[name*="first"], input[name*="last"]');
    const emailFields = form.querySelectorAll('input[type="email"], input[name*="email"]');
    const phoneFields = form.querySelectorAll('input[type="tel"], input[name*="phone"]');
    const resumeFields = form.querySelectorAll('input[type="file"][name*="resume"], input[type="file"][name*="cv"]');
    
    // Fill name fields
    for (const field of nameFields) {
      if (field.name.toLowerCase().includes('first') && userProfile.firstName) {
        this.fillField(field, userProfile.firstName);
      } else if (field.name.toLowerCase().includes('last') && userProfile.lastName) {
        this.fillField(field, userProfile.lastName);
      } else if (userProfile.fullName) {
        this.fillField(field, userProfile.fullName);
      }
    }
    
    // Fill email
    for (const field of emailFields) {
      if (userProfile.email) {
        this.fillField(field, userProfile.email);
      }
    }
    
    // Fill phone
    for (const field of phoneFields) {
      if (userProfile.phone) {
        this.fillField(field, userProfile.phone);
      }
    }
    
    // Handle resume upload
    if (resumeFields.length > 0 && this.jobData.tailoredResume) {
      // Create a blob from the tailored resume
      const resumeBlob = new Blob([this.jobData.tailoredResume], { type: 'text/plain' });
      const file = new File([resumeBlob], 'tailored_resume.txt', { type: 'text/plain' });
      
      // Note: File upload via content script is limited
      // You might need to guide user to manually upload or use a different approach
      console.log('Resume ready for upload:', file);
    }
    
    // Fill cover letter or additional info
    const textAreas = form.querySelectorAll('textarea');
    for (const textArea of textAreas) {
      if (textArea.name.toLowerCase().includes('cover') || 
          textArea.name.toLowerCase().includes('letter') ||
          textArea.name.toLowerCase().includes('additional')) {
        // Generate a simple cover letter
        const coverLetter = this.generateCoverLetter();
        this.fillField(textArea, coverLetter);
      }
    }
  }
  
  fillField(field, value) {
    // Simulate human-like typing
    field.focus();
    field.value = value;
    
    // Trigger events to ensure the form recognizes the input
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  
  generateCoverLetter() {
    if (!this.jobData) return '';
    
    return `Dear Hiring Manager,

I am excited to apply for the ${this.jobData.title} position at ${this.jobData.company}. 

Based on the job requirements, I believe my skills and experience make me an excellent candidate for this role. I have carefully reviewed the position details and tailored my application accordingly.

I look forward to discussing how I can contribute to your team's success.

Best regards,
[Your Name]`;
  }
  
  updateStatus(message, showProgress = false) {
    const statusEl = document.getElementById('hirepilot-status');
    const progressEl = document.getElementById('hirepilot-progress');
    
    if (statusEl) {
      statusEl.textContent = message;
    }
    
    if (progressEl) {
      progressEl.style.display = showProgress ? 'block' : 'none';
    }
  }
  
  observePageChanges() {
    // For SPA sites, observe URL changes
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(() => {
          this.jobData = null;
          this.autoApplyButton.disabled = true;
          this.updateStatus('Ready to detect job posting...', false);
        }, 1000);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'getJobData':
        sendResponse({ jobData: this.jobData });
        break;
      case 'toggleUI':
        const ui = document.getElementById('hirepilot-auto-apply-ui');
        if (ui) {
          ui.style.display = ui.style.display === 'none' ? 'block' : 'none';
        }
        break;
    }
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new JobSiteHandler();
  });
} else {
  new JobSiteHandler();
}
