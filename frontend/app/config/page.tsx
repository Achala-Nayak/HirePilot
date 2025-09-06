"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff, Save, Key, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ApiKeys {
  serpapi_key: string;
  gemini_api_key: string;
}

export default function ConfigPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    serpapi_key: "",
    gemini_api_key: "",
  });
  const [showSerpApi, setShowSerpApi] = useState(false);
  const [showGeminiApi, setShowGeminiApi] = useState(false);
  const [isLoading, setSaving] = useState(false);
  const [hasValidKeys, setHasValidKeys] = useState(false);

  // Load saved API keys on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem("hirepilot_api_keys");
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(parsed);
        setHasValidKeys(parsed.serpapi_key && parsed.gemini_api_key);
      } catch (error) {
        console.error("Error parsing saved API keys:", error);
      }
    }
  }, []);

  const handleInputChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!apiKeys.serpapi_key.trim() || !apiKeys.gemini_api_key.trim()) {
      toast.error("Please provide both API keys");
      return;
    }

    setSaving(true);
    
    try {
      localStorage.setItem("hirepilot_api_keys", JSON.stringify(apiKeys));
      setHasValidKeys(true);
      toast.success("API keys saved successfully!");
    } catch (error) {
      toast.error("Failed to save API keys");
      console.error("Error saving API keys:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setApiKeys({ serpapi_key: "", gemini_api_key: "" });
    localStorage.removeItem("hirepilot_api_keys");
    setHasValidKeys(false);
    toast.success("API keys cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Configuration</h1>
          <p className="text-gray-600">
            Configure your API keys to enable job searching and resume tailoring features.
          </p>
        </div>

        {hasValidKeys && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-700">API keys are configured and ready to use!</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {/* SerpAPI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                SerpAPI Key
              </CardTitle>
              <CardDescription>
                Required for job searching functionality. Get your API key from{" "}
                <a 
                  href="https://serpapi.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  serpapi.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serpapi">API Key</Label>
                <div className="relative">
                  <Input
                    id="serpapi"
                    type={showSerpApi ? "text" : "password"}
                    placeholder="Enter your SerpAPI key"
                    value={apiKeys.serpapi_key}
                    onChange={(e) => handleInputChange("serpapi_key", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSerpApi(!showSerpApi)}
                  >
                    {showSerpApi ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">How to get SerpAPI Key:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Visit serpapi.com and sign up</li>
                  <li>2. Go to your dashboard</li>
                  <li>3. Copy your API key</li>
                  <li>4. Paste it in the field above</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Gemini API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Google Gemini API Key
              </CardTitle>
              <CardDescription>
                Required for AI-powered resume tailoring. Get your API key from{" "}
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini">API Key</Label>
                <div className="relative">
                  <Input
                    id="gemini"
                    type={showGeminiApi ? "text" : "password"}
                    placeholder="Enter your Gemini API key"
                    value={apiKeys.gemini_api_key}
                    onChange={(e) => handleInputChange("gemini_api_key", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowGeminiApi(!showGeminiApi)}
                  >
                    {showGeminiApi ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">How to get Gemini API Key:</h4>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Visit Google AI Studio</li>
                  <li>2. Sign in with your Google account</li>
                  <li>3. Create a new API key</li>
                  <li>4. Copy and paste it above</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                • Your API keys are stored locally in your browser and are never sent to our servers.
              </p>
              <p>
                • Keys are included in requests only to the respective API services (SerpAPI and Google AI).
              </p>
              <p>
                • You can clear your keys at any time using the &ldquo;Clear Keys&rdquo; button below.
              </p>
              <p>
                • Make sure to keep your API keys secure and don&rsquo;t share them with others.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex-1 max-w-xs"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleClear}
            className="max-w-xs"
          >
            Clear Keys
          </Button>
        </div>

        {!hasValidKeys && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Configuration Required</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Please configure both API keys to use the job search and resume tailoring features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
