"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Search, Loader2, CheckCircle2, Sparkles, Target, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { validatePDFFile } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { JobSearchRequest, ExperienceLevel, JobResult } from "@/types/api";

interface JobSearchFormProps {
  onJobsFound: (jobs: JobResult[], searchParams: JobSearchRequest) => void;
  onResumeUploaded: (resumeText: string) => void;
}

export function JobSearchForm({ onJobsFound, onResumeUploaded }: JobSearchFormProps) {
  const [formData, setFormData] = useState<JobSearchRequest>({
    job_title: "",
    location: "",
    experience: undefined, // Keep as undefined 
    job_count: 10,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Calculate form completion progress
  useEffect(() => {
    let progress = 0;
    if (resumeText) progress += 40;
    if (formData.job_title) progress += 25;
    if (formData.location) progress += 25;
    if (formData.experience) progress += 10;
    setFormProgress(progress);
  }, [resumeText, formData]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const error = validatePDFFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      const response = await apiClient.extractFromPDF(file);
      if (response.success && response.resume_text) {
        setResumeText(response.resume_text);
        onResumeUploaded(response.resume_text);
        toast.success("Resume uploaded and text extracted successfully!");
      } else {
        throw new Error(response.message || "Failed to extract text from PDF");
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      toast.error("Failed to extract text from PDF. Please try again.");
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  }, [onResumeUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setResumeText("");
  };

  const handleSearch = async () => {
    if (!formData.job_title.trim() || !formData.location.trim()) {
      toast.error("Please fill in job title and location");
      return;
    }

    if (!resumeText.trim()) {
      toast.error("Please upload your resume first");
      return;
    }

    setIsSearching(true);

    try {
      const response = await apiClient.searchJobs(formData);
      if (response.success) {
        onJobsFound(response.jobs, formData);
        toast.success(`Found ${response.jobs.length} job opportunities!`);
      } else {
        throw new Error(response.message || "Failed to search jobs");
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to search for jobs. Please try again.";
      
      if (errorMessage.includes("API key")) {
        toast.error("Please configure your API keys in the settings to search for jobs.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const experienceLevels: ExperienceLevel[] = [
    "entry level",
    "junior", 
    "mid level",
    "senior",
    "lead",
    "executive"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-card/80 backdrop-blur-xl relative overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/20">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out"
          style={{ width: `${formProgress}%` }}
        />
      </div>
      
      {/* Background Decorations */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
      
      <CardHeader className="text-center pb-6 pt-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-foreground mb-2">
          Find Your Dream Job
        </CardTitle>
        <p className="text-muted-foreground text-lg">
          Upload your resume and let our AI work its magic
        </p>
        
        {/* Progress Indicators */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${resumeText ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                resumeText ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {resumeText ? <CheckCircle2 className="w-3 h-3" /> : '1'}
              </div>
              <span className="text-sm font-medium">Resume</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`flex items-center space-x-2 ${
              formData.job_title && formData.location ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                formData.job_title && formData.location ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {formData.job_title && formData.location ? <CheckCircle2 className="w-3 h-3" /> : '2'}
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={`flex items-center space-x-2 ${
              formProgress === 100 ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                formProgress === 100 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {formProgress === 100 ? <CheckCircle2 className="w-3 h-3" /> : '3'}
              </div>
              <span className="text-sm font-medium">Search</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 px-8 pb-8">
        {/* Enhanced File Upload */}
        <div className="space-y-3">
          <Label htmlFor="resume" className="text-base font-semibold flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            Upload Resume (PDF)
          </Label>
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${isDragActive 
                  ? "border-primary bg-primary/5 scale-102" 
                  : "border-border hover:border-primary/60 hover:bg-muted/30"
                }
                ${focusedField === 'upload' ? 'ring-2 ring-primary/20' : ''}
                group relative overflow-hidden
              `}
              onFocus={() => setFocusedField('upload')}
              onBlur={() => setFocusedField(null)}
            >
              <input {...getInputProps()} />
              <div className="relative z-10">
                <Upload className={`mx-auto h-12 w-12 mb-4 transition-all duration-300 ${
                  isDragActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-primary'
                }`} />
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragActive
                    ? "Drop your resume here..."
                    : "Drag & drop your resume here"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to select from your device
                </p>
                <Badge variant="secondary" className="bg-muted/50 text-xs">
                  PDF files only • Max 10MB
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="group bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-foreground block">
                      {uploadedFile.name}
                    </span>
                    <div className="flex items-center space-x-3 mt-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">Processed</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
          {isExtracting && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-base font-medium text-primary">Extracting text from resume...</span>
            </div>
          )}
        </div>

        {/* Enhanced Job Search Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="job_title" className="text-base font-semibold flex items-center">
              <Search className="w-4 h-4 mr-2 text-primary" />
              Job Title
            </Label>
            <div className="relative">
              <Input
                id="job_title"
                placeholder="e.g., Software Engineer, Data Scientist"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                onFocus={() => setFocusedField('job_title')}
                onBlur={() => setFocusedField(null)}
                className={`h-12 text-base border-2 transition-all duration-300 ${
                  focusedField === 'job_title' 
                    ? 'border-primary ring-4 ring-primary/10' 
                    : 'border-border hover:border-primary/60'
                } ${formData.job_title ? 'bg-primary/5' : ''}`}
              />
              {formData.job_title && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="location" className="text-base font-semibold flex items-center">
              <Target className="w-4 h-4 mr-2 text-primary" />
              Location
            </Label>
            <div className="relative">
              <Input
                id="location"
                placeholder="e.g., San Francisco, Remote, New York"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
                className={`h-12 text-base border-2 transition-all duration-300 ${
                  focusedField === 'location' 
                    ? 'border-primary ring-4 ring-primary/10' 
                    : 'border-border hover:border-primary/60'
                } ${formData.location ? 'bg-primary/5' : ''}`}
              />
              {formData.location && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="experience" className="text-base font-semibold flex items-center">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              Experience Level
            </Label>
            <Select
              value={formData.experience || ""}
              onValueChange={(value: string) => 
                setFormData({ ...formData, experience: value as ExperienceLevel || undefined })
              }
            >
              <SelectTrigger className={`h-12 text-base border-2 transition-all duration-300 ${
                formData.experience ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/60'
              }`}>
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level} className="text-base py-3">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="job_count" className="text-base font-semibold flex items-center">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              Number of Jobs
            </Label>
            <Select
              value={formData.job_count?.toString()}
              onValueChange={(value) => 
                setFormData({ ...formData, job_count: parseInt(value) })
              }
            >
              <SelectTrigger className={`h-12 text-base border-2 transition-all duration-300 ${
                formData.job_count ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/60'
              }`}>
                <SelectValue placeholder="How many jobs?" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 25, 30].map((count) => (
                  <SelectItem key={count} value={count.toString()} className="text-base py-3">
                    {count} jobs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Search Button */}
        <div className="pt-4">
          <Button
            onClick={handleSearch}
            disabled={isSearching || !resumeText.trim() || !formData.job_title.trim() || !formData.location.trim()}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-lg shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {isSearching ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Searching for perfect opportunities...
              </>
            ) : (
              <>
                <Search className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                Find My Dream Jobs
                <Sparkles className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </>
            )}
          </Button>
          
          {/* Helper Text */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            🚀 Our AI will analyze your resume and find the best matches in seconds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
