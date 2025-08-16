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
      color: "bg-foreground"
    },
    {
      icon: Brain,
      title: "AI Resume Tailoring",
      description: "Automatically optimize your resume for each job application with intelligent keyword matching.",
      badge: "AI Powered",
      color: "bg-foreground"
    },
    {
      icon: FileText,
      title: "Professional PDF Generation",
      description: "Generate beautifully formatted, ATS-optimized PDF resumes instantly.",
      badge: "Premium",
      color: "bg-foreground"
    },
    {
      icon: Target,
      title: "ATS Optimization",
      description: "Ensure your resume passes through Applicant Tracking Systems with optimized formatting.",
      badge: "Essential",
      color: "bg-foreground"
    },
    {
      icon: Clock,
      title: "Instant Processing",
      description: "Get tailored resumes and job matches in seconds, not hours.",
      badge: "Speed",
      color: "bg-foreground"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is secure and never shared. Complete privacy and confidentiality guaranteed.",
      badge: "Security",
      color: "bg-foreground"
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
    <section className="py-24 px-4 bg-gradient-to-br from-muted/30 via-background to-muted/50 relative overflow-hidden" id="features">
      {/* Background Decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(120,119,198,0.03),transparent_50%)]" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse delay-1000" />
      
      <div className="container mx-auto max-w-7xl relative">
        {/* Enhanced Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-4 w-4 mr-2 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Everything You Need to{" "}
            <span className="text-primary relative inline-block">
              Land Your Dream Job
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full" />
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Powered by advanced AI technology to give you the competitive edge in today&apos;s job market
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-0 bg-card/80 backdrop-blur hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Card Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardContent className="p-8 relative">
                  <div className="flex items-start space-x-5">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="font-bold text-foreground text-xl group-hover:text-primary transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                        >
                          {feature.badge}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced How It Works */}
        <div className="bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur rounded-3xl p-8 md:p-16 border border-border/50 shadow-2xl relative overflow-hidden" id="how-it-works">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.03),transparent_70%)]" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <TrendingUp className="h-4 w-4 mr-2 text-primary animate-bounce" />
                <span className="text-sm font-medium text-primary">Simple Process</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                How HirePilot Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Get from job search to tailored application in 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="text-center relative group">
                    {/* Enhanced Step Number */}
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-300">
                        <Icon className="h-9 w-9 text-primary-foreground group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-background border-2 border-primary rounded-full w-10 h-10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm font-bold text-primary">{step.step}</span>
                      </div>
                      {/* Enhanced Connector Line */}
                      {index < processSteps.length - 1 && (
                        <div className="hidden lg:block absolute top-10 left-full w-full">
                          <div className="w-full h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent transform -translate-y-1/2" />
                          <div className="w-2 h-2 bg-primary rounded-full absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Enhanced Step Content */}
                    <div className="group-hover:transform group-hover:-translate-y-1 transition-transform duration-300">
                      <h3 className="font-bold text-foreground mb-3 text-xl group-hover:text-primary transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>Average time: 3 minutes from upload to tailored resume</span>
              </div>
              <div className="flex justify-center">
                <Badge variant="secondary" className="bg-primary/10 text-primary px-6 py-2 text-lg font-semibold">
                  ⚡ 94% Success Rate
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
