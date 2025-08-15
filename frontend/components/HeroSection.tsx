"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap, Target, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const router = useRouter();
  
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/apply');
    }
  };

  const features = [
    { icon: Zap, text: "AI-Powered Matching" },
    { icon: Target, text: "ATS Optimized" },
    { icon: Clock, text: "Instant Results" },
    { icon: Sparkles, text: "Professional Quality" }
  ];

  return (
    <section className="relative py-20 md:py-32 px-4 bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping delay-2000" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-primary/60 rounded-full animate-ping delay-3000" />

      <div className="container mx-auto max-w-6xl text-center relative">
        {/* Main Content */}
        <div className="space-y-8 mb-12">
          {/* Status Badge */}
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur">
            <Sparkles className="h-4 w-4 mr-2 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">AI-Powered Career Assistant</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-7xl font-bold text-foreground leading-tight">
            Land Your Dream Job with{" "}
            <span className="text-primary relative inline-block">
              AI-Tailored Resumes
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full animate-pulse" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your job search with intelligent resume optimization. 
            Upload your resume, search jobs, and get perfectly tailored applications in seconds.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="px-4 py-2 bg-background/80 backdrop-blur border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 cursor-default group"
                >
                  <Icon className="h-4 w-4 mr-2 text-primary group-hover:animate-pulse" />
                  <span className="font-medium">{feature.text}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 group"
          >
            Start Now
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </section>
  );
}
