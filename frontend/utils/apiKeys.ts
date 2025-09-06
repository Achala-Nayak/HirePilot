// Utility functions for managing API keys
export interface ApiKeys {
  serpapi_key: string;
  gemini_api_key: string;
}

export const getApiKeys = (): ApiKeys | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const savedKeys = localStorage.getItem("hirepilot_api_keys");
    if (savedKeys) {
      return JSON.parse(savedKeys);
    }
  } catch (error) {
    console.error("Error parsing API keys from localStorage:", error);
  }
  
  return null;
};

export const hasValidApiKeys = (): boolean => {
  const keys = getApiKeys();
  return !!(keys?.serpapi_key && keys?.gemini_api_key);
};

export const setApiKeys = (keys: ApiKeys): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem("hirepilot_api_keys", JSON.stringify(keys));
  } catch (error) {
    console.error("Error saving API keys to localStorage:", error);
    throw new Error("Failed to save API keys");
  }
};

export const clearApiKeys = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem("hirepilot_api_keys");
  } catch (error) {
    console.error("Error clearing API keys from localStorage:", error);
  }
};
