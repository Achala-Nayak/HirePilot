import { 
  JobSearchRequest, 
  JobSearchResponse, 
  ResumeTailorRequest, 
  ResumeTailorResponse,
  ResumePDFGenerateRequest,
  ResumeParseRequest,
  ResumeParseResponse,
  UploadResponse 
} from '@/types/api';
import { getApiKeys } from '@/utils/apiKeys';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Job Search APIs
  async searchJobs(data: JobSearchRequest): Promise<JobSearchResponse> {
    const apiKeys = getApiKeys();
    if (!apiKeys || !apiKeys.serpapi_key) {
      throw new Error("SerpAPI key is required. Please configure your API keys in the settings.");
    }

    const requestData = {
      ...data,
      api_keys: apiKeys
    };

    return this.request<JobSearchResponse>('/api/v1/jobs/search', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getExperienceLevels(): Promise<string[]> {
    return this.request<string[]>('/api/v1/jobs/experience-levels');
  }

  // Resume Processing APIs
  async tailorResume(data: ResumeTailorRequest): Promise<ResumeTailorResponse> {
    const apiKeys = getApiKeys();
    if (!apiKeys || !apiKeys.gemini_api_key) {
      throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
    }

    const requestData = {
      ...data,
      api_keys: apiKeys
    };

    return this.request<ResumeTailorResponse>('/api/v1/resume/tailor', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async tailorResumePDF(data: ResumeTailorRequest): Promise<Blob> {
    const apiKeys = getApiKeys();
    if (!apiKeys || !apiKeys.gemini_api_key) {
      throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
    }

    const requestData = {
      ...data,
      api_keys: apiKeys
    };

    const url = `${API_BASE_URL}/api/v1/resume/tailor-pdf`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async uploadAndTailorPDF(
    file: File,
    jobDescription: string,
    jobTitle: string,
    companyName: string
  ): Promise<Blob> {
    const apiKeys = getApiKeys();
    if (!apiKeys || !apiKeys.gemini_api_key) {
      throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);
    formData.append('job_title', jobTitle);
    formData.append('company_name', companyName);
    formData.append('api_keys', JSON.stringify(apiKeys));

    const url = `${API_BASE_URL}/api/v1/resume/upload-and-tailor-pdf`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async generatePDFFromText(data: ResumePDFGenerateRequest): Promise<Blob> {
    const apiKeys = getApiKeys();
    if (!apiKeys || !apiKeys.gemini_api_key) {
      throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
    }

    const requestData = {
      ...data,
      api_keys: apiKeys
    };

    const url = `${API_BASE_URL}/api/v1/resume/generate-pdf-from-text`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async parseResume(data: ResumeParseRequest): Promise<ResumeParseResponse> {
    const apiKeys = getApiKeys();
    if (!apiKeys || !apiKeys.gemini_api_key) {
      throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
    }

    const requestData = {
      ...data,
      api_keys: apiKeys
    };

    return this.request<ResumeParseResponse>('/api/v1/resume/parse', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async extractFromPDF(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.uploadRequest<UploadResponse>('/api/v1/resume/extract-from-pdf', formData);
  }

  // Health Check APIs
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/');
  }
}

export const apiClient = new ApiClient();
