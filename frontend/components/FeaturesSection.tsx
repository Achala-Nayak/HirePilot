"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Brain, 
  FileText, 
  Download, 
  Zap, 
  Shield,
  Clock,
  Target,
  TrendingUp
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "Smart Job Search",
      description: "AI-powered job matching that finds opportunities tailored to your skills and experience level.",
      badge: "Core Feature",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Brain,
      title: "AI Resume Tailoring",
      description: "Automatically optimize your resume for each job application with intelligent keyword matching.",
      badge: "AI Powered",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: FileText,
      title: "Professional PDF Generation",
      description: "Generate beautifully formatted, ATS-optimized PDF resumes instantly.",
      badge: "Premium",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Target,
      title: "ATS Optimization",
      description: "Ensure your resume passes through Applicant Tracking Systems with optimized formatting.",
      badge: "Essential",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Clock,
      title: "Instant Processing",
      description: "Get tailored resumes and job matches in seconds, not hours.",
      badge: "Speed",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is secure and never shared. Complete privacy and confidentiality guaranteed.",
      badge: "Security",
      color: "from-gray-500 to-gray-600"
    }
  ];

  const processSteps = [
    {
      step: "01",
      title: "Upload Resume",
      description: "Upload your current resume in PDF format",
      icon: FileText
    },
    {
      step: "02", 
      title: "Search Jobs",
      description: "Enter job title, location, and experience level",
      icon: Search
    },
    {
      step: "03",
      title: "AI Magic",
      description: "Our AI tailors your resume for each job opportunity",
      icon: Brain
    },
    {
      step: "04",
      title: "Download & Apply",
      description: "Get optimized resumes and apply with confidence",
      icon: Download
    }
  ];

  return (
    <section className="py-20 px-4 bg-white" id="features">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Land Your Dream Job
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powered by advanced AI technology to give you the competitive edge in today's job market
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${feature.color} flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {feature.badge}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 md:p-12" id="how-it-works">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="h-3 w-3 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Hire Pilot Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get from job search to tailored application in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center relative">
                  {/* Step Number */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white border-2 border-blue-600 rounded-full w-8 h-8 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">{step.step}</span>
                    </div>
                    {/* Connector Line */}
                    {index < processSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 transform -translate-y-1/2" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
