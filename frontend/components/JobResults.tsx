"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Building, 
  ExternalLink, 
  FileText, 
  Download, 
  Loader2, 
  Sparkles,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { JobResult, JobSearchRequest } from "@/types/api";
import { apiClient } from "@/lib/api";
import { downloadBlob, truncateText, isValidUrl } from "@/lib/utils";

interface JobResultsProps {
  jobs: JobResult[];
  searchParams: JobSearchRequest;
  resumeText: string;
}

export function JobResults({ jobs, searchParams, resumeText }: JobResultsProps) {
  const [tailoringJobs, setTailoringJobs] = useState<Set<string>>(new Set());

  const handleTailorResume = async (job: JobResult) => {
    if (!job.job_id || !job.description || !job.title || !job.company_name) {
      toast.error("Job information is incomplete");
      return;
    }

    setTailoringJobs(prev => new Set(prev).add(job.job_id!));

    try {
      const response = await apiClient.tailorResumePDF({
        resume_text: resumeText,
        job_description: job.description,
        job_title: job.title,
        company_name: job.company_name,
      });

      // Generate filename
      const companyClean = job.company_name.replace(/[^a-zA-Z0-9]/g, '_');
      const titleClean = job.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Tailored_Resume_${companyClean}_${titleClean}_${new Date().toISOString().split('T')[0]}.pdf`;

      downloadBlob(response, filename);
      toast.success("Resume tailored and downloaded successfully!");
    } catch (error) {
      console.error("Error tailoring resume:", error);
      toast.error("Failed to tailor resume. Please try again.");
    } finally {
      setTailoringJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.job_id!);
        return newSet;
      });
    }
  };

  const isJobTailoring = (jobId: string) => tailoringJobs.has(jobId);

  if (jobs.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No jobs found. Try adjusting your search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Found {jobs.length} Opportunities
        </h2>
        <p className="text-gray-600 mt-2">
          Perfect matches for {searchParams.job_title} in {searchParams.location}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job, index) => (
          <Card key={job.job_id || index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {job.title || "Untitled Position"}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-gray-600">
                      <Building className="h-4 w-4 mr-1" />
                      <span className="font-medium">{job.company_name || "Unknown Company"}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{job.location}</span>
                      </div>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="ml-2">
                  #{index + 1}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Job Description Preview */}
              {job.description && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {truncateText(job.description, 200)}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View Full Description
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="text-left">
                          {job.title} at {job.company_name}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-96 mt-4">
                        <div className="whitespace-pre-wrap text-sm text-gray-700 pr-4">
                          {job.description}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {job.job_url && isValidUrl(job.job_url) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => window.open(job.job_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Apply Now
                  </Button>
                )}

                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  onClick={() => handleTailorResume(job)}
                  disabled={isJobTailoring(job.job_id || '') || !job.description}
                >
                  {isJobTailoring(job.job_id || '') ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Tailoring...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Tailor Resume
                    </>
                  )}
                </Button>
              </div>

              {!job.job_url && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ No direct application link available
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resume Tailoring Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Resume Tailoring</h3>
              <p className="text-sm text-gray-600 mb-2">
                Click "Tailor Resume" to generate a customized resume optimized for each specific job posting. 
                Our AI analyzes the job description and enhances your resume with relevant keywords and achievements.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• ATS-optimized formatting</li>
                <li>• Keyword enhancement</li>
                <li>• Professional PDF generation</li>
                <li>• Instant download</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
