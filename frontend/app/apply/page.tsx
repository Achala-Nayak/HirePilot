"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { JobSearchForm } from "@/components/JobSearchForm";
import { JobResults } from "@/components/JobResults";
import { Footer } from "@/components/Footer";
import { JobResult, JobSearchRequest } from "@/types/api";

export default function ApplyPage() {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [searchParams, setSearchParams] = useState<JobSearchRequest | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  
  const formRef = useRef<HTMLDivElement>(null);

  const handleJobsFound = (foundJobs: JobResult[], params: JobSearchRequest) => {
    setJobs(foundJobs);
    setSearchParams(params);
    setShowResults(true);
  };

  const handleResumeUploaded = (text: string) => {
    setResumeText(text);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Job Search Form & Results */}
      <section className="py-16 px-4 bg-gradient-to-br from-background via-muted/20 to-background relative" ref={formRef}>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.01)_50%,transparent_100%)]" />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-primary/5 rounded-full blur-2xl" />
            
            {/* Job Search Form */}
            <JobSearchForm 
              onJobsFound={handleJobsFound}
              onResumeUploaded={handleResumeUploaded}
            />
          </div>

          {/* Job Results */}
          {showResults && jobs.length > 0 && searchParams && (
            <div className="mt-12">
              <div className="bg-card/50 backdrop-blur rounded-3xl p-8 border border-border/50 shadow-2xl">
                <JobResults 
                  jobs={jobs}
                  searchParams={searchParams}
                  resumeText={resumeText}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
