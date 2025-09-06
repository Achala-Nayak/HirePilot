// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  error_code?: string;
}

// API Keys Types
export interface ApiKeys {
  serpapi_key?: string;
  gemini_api_key?: string;
}

// Job Search Types
export type ExperienceLevel = 
  | "entry level"
  | "junior"
  | "mid level"
  | "senior"
  | "lead"
  | "executive";

export interface JobSearchRequest {
  job_title: string;
  location: string;
  experience?: ExperienceLevel;
  job_count?: number;
  api_keys?: ApiKeys;
}

export interface JobResult {
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  job_url?: string;
  job_id?: string;
  raw_data?: Record<string, any>;
}

export interface JobSearchResponse extends ApiResponse {
  jobs: JobResult[];
  total_count: number;
}

// Resume Types
export interface ResumeTailorRequest {
  resume_text: string;
  job_description: string;
  job_title: string;
  company_name: string;
  api_keys: ApiKeys;
}

export interface ResumeTailorResponse extends ApiResponse {
  tailored_resume_text?: string;
  filename?: string;
}

export interface ResumePDFGenerateRequest {
  tailored_resume_text: string;
  job_title: string;
  company_name: string;
  api_keys: ApiKeys;
}

export interface ResumeParseRequest {
  resume_text: string;
  api_keys: ApiKeys;
}

export interface ResumeParseResponse extends ApiResponse {
  parsed_data?: Record<string, string>;
}

// File Upload Types
export interface UploadResponse extends ApiResponse {
  resume_text?: string;
  filename?: string;
}
