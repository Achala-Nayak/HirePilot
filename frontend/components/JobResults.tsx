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
  Loader2, 
  Sparkles,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { JobResult, JobSearchRequest } from "@/types/api";
import { apiClient } from "@/lib/api";
import { truncateText, isValidUrl } from "@/lib/utils";
import { ResumeEditor } from "@/components/ResumeEditor";

interface JobResultsProps {
  jobs: JobResult[];
  searchParams: JobSearchRequest;
  resumeText: string;
}

export function JobResults({ jobs, searchParams, resumeText }: JobResultsProps) {
  const [tailoringJobs, setTailoringJobs] = useState<Set<string>>(new Set());
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    job: JobResult | null;
    tailoredResumeText: string;
  }>({
    isOpen: false,
    job: null,
    tailoredResumeText: "",
  });

  const handleTailorResume = async (job: JobResult) => {
    if (!job.job_id || !job.description || !job.title || !job.company_name) {
      toast.error("Job information is incomplete");
      return;
    }

    setTailoringJobs(prev => new Set(prev).add(job.job_id!));

    try {
      const response = await apiClient.tailorResume({
        resume_text: resumeText,
        job_description: job.description,
        job_title: job.title,
        company_name: job.company_name,
      });

      if (response.success && response.tailored_resume_text) {
        // Open the editor with the tailored resume text
        setEditorState({
          isOpen: true,
          job: job,
          tailoredResumeText: response.tailored_resume_text,
        });
      } else {
        throw new Error(response.message || "Failed to tailor resume");
      }
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

  const handleCloseEditor = () => {
    setEditorState({
      isOpen: false,
      job: null,
      tailoredResumeText: "",
    });
  };

  const isJobTailoring = (jobId: string) => tailoringJobs.has(jobId);

  if (jobs.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No jobs found. Try adjusting your search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Found {jobs.length} Opportunities
        </h2>
        <p className="text-muted-foreground mt-2">
          Perfect matches for {searchParams.job_title} in {searchParams.location}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job, index) => (
          <Card key={job.job_id || index} className="group hover:shadow-lg transition-all duration-300 border border-border shadow-md bg-card backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {job.title || "Untitled Position"}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-muted-foreground">
                      <Building className="h-4 w-4 mr-1" />
                      <span className="font-medium">{job.company_name || "Unknown Company"}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground line-clamp-3">
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
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground pr-4">
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
                    className="flex-1 border-border hover:bg-muted hover:border-primary"
                    onClick={() => window.open(job.job_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Apply Now
                  </Button>
                )}

                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
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
                      Edit & Tailor Resume
                    </>
                  )}
                </Button>
              </div>

              {!job.job_url && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded border border-border">
                  ⚠️ No direct application link available
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resume Tailoring Info */}
      <Card className="bg-muted border border-border">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">AI-Powered Resume Editing</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Click &quot;Edit &amp; Tailor Resume&quot; to generate a customized resume that you can review and edit before downloading.
                Our AI analyzes the job description and enhances your resume with relevant keywords and achievements.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• AI-tailored content generation</li>
                <li>• Interactive editing interface</li>
                <li>• Real-time word and character count</li>
                <li>• Professional PDF generation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Editor Modal */}
      {editorState.job && (
        <ResumeEditor
          isOpen={editorState.isOpen}
          onClose={handleCloseEditor}
          job={editorState.job}
          tailoredResumeText={editorState.tailoredResumeText}
        />
      )}
    </div>
  );
}
