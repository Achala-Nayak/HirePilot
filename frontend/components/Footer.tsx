"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Plane, 
  Github, 
  Linkedin,
  Heart
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "https://github.com/Achala-Nayak" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/achalanayak/" },
  ];

  return (
    <footer className="bg-background border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">
                Hire Pilot
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Your AI co-pilot for job hunting. Find opportunities and generate tailored professional resumes instantly.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-2 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                    asChild
                  >
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{social.name}</span>
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>AI-Powered Job Search</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>Resume Tailoring</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>Professional PDF Generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                <span>ATS Optimization</span>
              </li>
            </ul>
          </div>

          {/* Stats/Info Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Why Choose Hire Pilot?</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                  <span className="text-primary font-semibold">🚀</span>
                </div>
                <span className="text-muted-foreground">Powered by AI</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                  <span className="text-primary font-semibold">🔒</span>
                </div>
                <span className="text-muted-foreground">Privacy First</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                  <span className="text-primary font-semibold">⚡</span>
                </div>
                <span className="text-muted-foreground">Lightning Fast</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-border/50" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1 mb-4 md:mb-0">
            <span>© {currentYear} Hire Pilot. Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current mx-1" />
            <span>for job seekers everywhere.</span>
          </div>
          <div className="text-xs text-muted-foreground/80">
            All rights reserved. Built for the future of job hunting.
          </div>
        </div>
      </div>
    </footer>
  );
}
