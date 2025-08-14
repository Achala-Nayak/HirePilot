"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { JobSearchForm } from "@/components/JobSearchForm";
import { JobResults } from "@/components/JobResults";
import { Footer } from "@/components/Footer";
import { JobResult, JobSearchRequest } from "@/types/api";

export default function HomePage() {
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

  const handleGetStarted = () => {
    formRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Job Search Form */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50" ref={formRef}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Job Search Journey
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload your resume and let our AI find the perfect job opportunities for you
            </p>
          </div>
          
          <JobSearchForm 
            onJobsFound={handleJobsFound}
            onResumeUploaded={handleResumeUploaded}
          />
        </div>
      </section>

      {/* Job Results */}
      {showResults && jobs.length > 0 && searchParams && (
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto">
            <JobResults 
              jobs={jobs}
              searchParams={searchParams}
              resumeText={resumeText}
            />
          </div>
        </section>
      )}
      
      <Footer />
    </div>
  );
}
