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
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">
                Hire Pilot
              </span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-sm text-center md:text-left">
              Your AI co-pilot for job hunting. Find opportunities and generate tailored professional resumes instantly.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex space-x-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground p-2"
                  asChild
                >
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{social.name}</span>
                  </a>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1 mb-4 md:mb-0">
            <span>© {currentYear} Hire Pilot. Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for job seekers everywhere.</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>🚀 Powered by AI</span>
            <span>🔒 Privacy First</span>
            <span>⚡ Lightning Fast</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
