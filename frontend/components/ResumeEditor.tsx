"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Loader2, 
  Edit3,
  X,
  Building,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { JobResult } from "@/types/api";
import { apiClient } from "@/lib/api";
import { getApiKeys } from "@/utils/apiKeys";
import { downloadBlob } from "@/lib/utils";

interface ResumeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobResult;
  tailoredResumeText: string;
}

export function ResumeEditor({ isOpen, onClose, job, tailoredResumeText }: ResumeEditorProps) {
  const [editedResumeText, setEditedResumeText] = useState(tailoredResumeText);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!job.title || !job.company_name || !editedResumeText.trim()) {
      toast.error("Missing required information");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const apiKeys = getApiKeys();
      if (!apiKeys || !apiKeys.gemini_api_key) {
        toast.error("Please configure your API keys to generate PDFs.");
        return;
      }

      const response = await apiClient.generatePDFFromText({
        tailored_resume_text: editedResumeText,
        job_title: job.title || "",
        company_name: job.company_name || "",
        api_keys: apiKeys,
      });

      // Generate filename
      const companyClean = job.company_name.replace(/[^a-zA-Z0-9]/g, '_');
      const titleClean = job.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Tailored_Resume_${companyClean}_${titleClean}_${new Date().toISOString().split('T')[0]}.pdf`;

      downloadBlob(response, filename);
      toast.success("Resume PDF downloaded successfully!");
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const hasChanges = editedResumeText !== tailoredResumeText;
  const wordCount = editedResumeText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = editedResumeText.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 gap-0 sm:max-w-7xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Edit3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">
                    Resume Editor
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Review and customize your AI-tailored resume
                  </DialogDescription>
                </div>
              </div>
              
              {/* Job Info */}
              <div className="flex items-center gap-4 text-sm ml-11">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{job.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{job.company_name}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <div className="flex flex-col gap-6 h-[calc(90vh-200px)]">
              {/* Editor Section - Full width now */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Resume Content
                        {hasChanges && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300">
                            Modified
                          </Badge>
                        )}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Make any adjustments to optimize your resume for this specific role
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Textarea
                      value={editedResumeText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedResumeText(e.target.value)}
                      className="h-[calc(90vh-300px)] min-h-[400px] font-mono text-sm resize-none border-2 focus:border-primary/50 transition-colors rounded-lg"
                      placeholder="Your tailored resume content will appear here..."
                    />
                    
                    {/* Content Stats Overlay */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 border shadow-sm text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{wordCount}</span>
                        <span>words</span>
                      </div>
                      <div className="w-px h-3 bg-border"></div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{charCount}</span>
                        <span>chars</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Review your content carefully before generating the final PDF
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGeneratingPDF}
                className="gap-2 flex-1 sm:flex-none"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF || !editedResumeText.trim()}
                className="bg-primary hover:bg-primary/90 gap-2 min-w-[140px] flex-1 sm:flex-none"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
