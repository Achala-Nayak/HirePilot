"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Search, 
  FileText, 
  Zap, 
  TrendingUp, 
  Shield,
  CheckCircle
} from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const stats = [
    { label: "Jobs Matched", value: "10K+", icon: Search },
    { label: "Resumes Tailored", value: "5K+", icon: FileText },
    { label: "Success Rate", value: "94%", icon: TrendingUp },
  ];

  const features = [
    "AI-powered job matching",
    "Instant resume tailoring",
    "ATS-optimized PDFs",
    "Professional formatting"
  ];

  return (
    <section className="relative py-20 px-4 text-center overflow-hidden bg-background" id="home">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,0,0,0.05),transparent_50%)] bg-[radial-gradient(circle_at_70%_60%,rgba(0,0,0,0.03),transparent_50%)]" />
      
      <div className="relative container mx-auto max-w-6xl">
        <div className="flex flex-col items-center space-y-8">
          {/* Badge */}
          <Badge variant="secondary" className="bg-card border border-border px-4 py-1.5">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Job Search Platform
          </Badge>

          {/* Main Heading */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
              Your AI Co-Pilot for{" "}
              <span className="text-primary">
                Job Hunting
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Find your dream job and generate tailored, professional resumes instantly. 
              Let AI match you with the perfect opportunities and optimize your resume for each application.
            </p>
          </div>

          {/* Features List */}
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center bg-card backdrop-blur rounded-full px-3 py-1.5 border border-border">
                <CheckCircle className="h-3 w-3 text-foreground mr-1.5" />
                <span className="text-sm font-medium text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={onGetStarted}
            >
              <Zap className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-border hover:border-primary hover:bg-muted px-8 py-3 text-lg font-medium transition-all duration-300"
            >
              <Shield className="mr-2 h-5 w-5" />
              How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 max-w-2xl w-full">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 border-t border-border max-w-2xl w-full">
            <p className="text-sm text-muted-foreground mb-4">Trusted by job seekers worldwide</p>
            <div className="flex justify-center items-center space-x-6 opacity-60">
              <div className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded">ENTERPRISE</div>
              <div className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded">SECURE</div>
              <div className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded">GDPR COMPLIANT</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
