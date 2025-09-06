"use client";

import { useState, useEffect } from "react";
import { hasValidApiKeys } from "@/utils/apiKeys";
import { Button } from "@/components/ui/button";
import { AlertCircle, Settings } from "lucide-react";
import Link from "next/link";

interface ApiKeyCheckProps {
  children: React.ReactNode;
  requiredKeys?: ("serpapi_key" | "gemini_api_key")[];
}

export function ApiKeyCheck({ children, requiredKeys = ["serpapi_key", "gemini_api_key"] }: ApiKeyCheckProps) {
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasKeys(hasValidApiKeys());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800 mb-2">API Configuration Required</h3>
            <p className="text-sm text-amber-700 mb-4">
              You need to configure your API keys before using this feature. 
              {requiredKeys.includes("serpapi_key") && " SerpAPI is required for job searching."}
              {requiredKeys.includes("gemini_api_key") && " Gemini API is required for resume processing."}
            </p>
            <Link href="/config">
              <Button size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure APIs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
