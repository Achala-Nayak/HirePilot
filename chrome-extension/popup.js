// Popup JavaScript for HirePilot Auto Apply Extension

document.addEventListener('DOMContentLoaded', async () => {
  // Load initial state
  await loadSettings();
  await loadProfile();
  await loadRecentApplications();
  
  // Set up event listeners
  setupEventListeners();
  
  // Update status
  updateStatus();
});

function setupEventListeners() {
  // Analyze current job
  document.getElementById('analyzeJob').addEventListener('click', analyzeCurrentJob);
  
  // Toggle auto-apply
  document.getElementById('toggleAutoApply').addEventListener('click', toggleAutoApply);
  
  // Settings toggle
  document.getElementById('settingsToggle').addEventListener('click', () => {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  
  // Profile toggle
  document.getElementById('profileToggle').addEventListener('click', () => {
    const panel = document.getElementById('profilePanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  
  // Save settings
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // Save profile
  document.getElementById('profileForm').addEventListener('submit', saveProfile);
  
  // Open dashboard
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' }); // Your frontend URL
  });
}

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    
    if (response.success) {
      const settings = response.settings;
      
      // Update UI with current settings
      document.getElementById('maxAppsInput').value = settings.maxApplicationsPerDay || 10;
      document.getElementById('applicationsToday').textContent = settings.applicationsToday || 0;
      document.getElementById('maxApplications').textContent = settings.maxApplicationsPerDay || 10;
      
      // Update toggle button
      const toggleButton = document.getElementById('toggleAutoApply');
      const toggleText = document.getElementById('toggleText');
      
      if (settings.autoApplyEnabled) {
        toggleButton.classList.add('enabled');
        toggleText.textContent = 'Disable Auto Apply';
      } else {
        toggleButton.classList.remove('enabled');
        toggleText.textContent = 'Enable Auto Apply';
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function loadProfile() {
  try {
    const result = await chrome.storage.sync.get(['userProfile']);
    const profile = result.userProfile || {};
    
    // Populate form fields
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('linkedin').value = profile.linkedin || '';
    document.getElementById('portfolio').value = profile.portfolio || '';
    
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadRecentApplications() {
  try {
    const result = await chrome.storage.local.get(['applications']);
    const applications = result.applications || [];
    
    // Filter today's applications
    const today = new Date().toDateString();
    const todayApplications = applications.filter(app => 
      new Date(app.appliedAt).toDateString() === today
    );
    
    const container = document.getElementById('recentApplications');
    
    if (todayApplications.length === 0) {
      container.innerHTML = '<p class="no-applications">No applications yet today</p>';
    } else {
      container.innerHTML = todayApplications.map(app => `
        <div class="application-item">
          <div class="application-title">${app.jobTitle}</div>
          <div class="application-company">${app.company}</div>
          <div class="application-time">${new Date(app.appliedAt).toLocaleTimeString()}</div>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

async function analyzeCurrentJob() {
  const button = document.getElementById('analyzeJob');
  const originalText = button.textContent;
  
  try {
    button.textContent = '🔄 Analyzing...';
    button.disabled = true;
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { 
      action: 'analyzeJob' 
    });
    
    if (response && response.success) {
      updateStatus('Job analyzed successfully!', 'success');
    } else {
      updateStatus('Failed to analyze job', 'error');
    }
    
  } catch (error) {
    console.error('Error analyzing job:', error);
    updateStatus('Error analyzing job', 'error');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}

async function toggleAutoApply() {
  try {
    const result = await chrome.storage.sync.get(['autoApplyEnabled']);
    const currentState = result.autoApplyEnabled || false;
    const newState = !currentState;
    
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      data: { autoApplyEnabled: newState }
    });
    
    // Update UI
    const toggleButton = document.getElementById('toggleAutoApply');
    const toggleText = document.getElementById('toggleText');
    
    if (newState) {
      toggleButton.classList.add('enabled');
      toggleText.textContent = 'Disable Auto Apply';
      updateStatus('Auto-apply enabled', 'success');
    } else {
      toggleButton.classList.remove('enabled');
      toggleText.textContent = 'Enable Auto Apply';
      updateStatus('Auto-apply disabled', 'warning');
    }
    
  } catch (error) {
    console.error('Error toggling auto-apply:', error);
    updateStatus('Error updating settings', 'error');
  }
}

async function saveSettings() {
  try {
    const maxApplications = parseInt(document.getElementById('maxAppsInput').value);
    const autoMode = document.getElementById('autoMode').value;
    
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      data: {
        maxApplicationsPerDay: maxApplications,
        autoMode: autoMode
      }
    });
    
    updateStatus('Settings saved!', 'success');
    
    // Update display
    document.getElementById('maxApplications').textContent = maxApplications;
    
  } catch (error) {
    console.error('Error saving settings:', error);
    updateStatus('Error saving settings', 'error');
  }
}

async function saveProfile(event) {
  event.preventDefault();
  
  try {
    const profile = {
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      linkedin: document.getElementById('linkedin').value,
      portfolio: document.getElementById('portfolio').value
    };
    
    await chrome.storage.sync.set({ userProfile: profile });
    
    updateStatus('Profile saved!', 'success');
    
  } catch (error) {
    console.error('Error saving profile:', error);
    updateStatus('Error saving profile', 'error');
  }
}

function updateStatus(message = 'Ready', type = 'ready') {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  // Remove existing status classes
  statusIndicator.className = 'status-indicator';
  
  // Add new status class
  statusIndicator.classList.add(`status-${type}`);
  
  // Update text
  statusText.textContent = message;
  
  // Auto-clear status messages after 3 seconds (except for 'ready')
  if (type !== 'ready') {
    setTimeout(() => {
      updateStatus();
    }, 3000);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updatePopup') {
    loadSettings();
    loadRecentApplications();
  }
});
