import { api } from "@/services/api";
import { getApiKeys } from "./apiKeys";

export async function getRoot() {
  const res = await api.get("/");
  return res.data;
}

// Job search function with API keys
export async function searchJobs(searchData: {
  job_title: string;
  location: string;
  experience?: string;
  job_count?: number;
}) {
  const apiKeys = getApiKeys();
  if (!apiKeys || !apiKeys.serpapi_key) {
    throw new Error("SerpAPI key is required. Please configure your API keys in the settings.");
  }

  const res = await api.post("/api/v1/jobs/search", {
    ...searchData,
    api_keys: apiKeys
  });
  return res.data;
}

// Resume tailoring function with API keys
export async function generateTailoredResume(formData: FormData, jobData: any) {
  const apiKeys = getApiKeys();
  if (!apiKeys || !apiKeys.gemini_api_key) {
    throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
  }

  // Add API keys to form data
  formData.append("api_keys", JSON.stringify(apiKeys));
  formData.append("job_title", jobData.title || "");
  formData.append("company_name", jobData.company_name || "");
  formData.append("job_description", jobData.description || "");

  const res = await api.post("/api/v1/resume/tailor-pdf", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
  return res.data;
}

// Resume parsing function with API keys
export async function parseResume(formData: FormData) {
  const apiKeys = getApiKeys();
  if (!apiKeys || !apiKeys.gemini_api_key) {
    throw new Error("Gemini API key is required. Please configure your API keys in the settings.");
  }

  // Add API keys to form data
  formData.append("api_keys", JSON.stringify(apiKeys));

  const res = await api.post("/api/v1/resume/parse", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}
