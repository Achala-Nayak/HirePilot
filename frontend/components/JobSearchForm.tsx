"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validatePDFFile } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { JobSearchRequest, ExperienceLevel } from "@/types/api";

interface JobSearchFormProps {
  onJobsFound: (jobs: any[], searchParams: JobSearchRequest) => void;
  onResumeUploaded: (resumeText: string) => void;
}

export function JobSearchForm({ onJobsFound, onResumeUploaded }: JobSearchFormProps) {
  const [formData, setFormData] = useState<JobSearchRequest>({
    job_title: "",
    location: "",
    experience: undefined,
    job_count: 10,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

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
      toast.error("Failed to search for jobs. Please try again.");
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
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Find Your Dream Job
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Upload your resume and let AI find the perfect opportunities for you
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="resume" className="text-sm font-medium">
            Upload Resume (PDF)
          </Label>
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? "Drop your resume here..."
                  : "Drag & drop your resume here, or click to select"}
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF files only, max 10MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {uploadedFile.name}
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {isExtracting && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Extracting text from resume...</span>
            </div>
          )}
        </div>

        {/* Job Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-sm font-medium">
              Job Title
            </Label>
            <Input
              id="job_title"
              placeholder="e.g., Software Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="experience" className="text-sm font-medium">
              Experience Level
            </Label>
            <Select
              value={formData.experience}
              onValueChange={(value: ExperienceLevel) => 
                setFormData({ ...formData, experience: value })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_count" className="text-sm font-medium">
              Number of Jobs
            </Label>
            <Select
              value={formData.job_count?.toString()}
              onValueChange={(value) => 
                setFormData({ ...formData, job_count: parseInt(value) })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 25, 30].map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} jobs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={isSearching || !resumeText.trim() || !formData.job_title.trim() || !formData.location.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
          size="lg"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching for opportunities...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Find Jobs
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
