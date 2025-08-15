"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Plane, ArrowRight} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      // Handle anchor links - scroll to section on current page or navigate to home first
      if (window.location.pathname !== '/') {
        router.push('/' + href);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      // Handle route navigation
      router.push(href);
    }
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Job Search", href: "/apply" },
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">
                Hire Pilot
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/apply">
              <Button
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 group"
              >
                Start Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background border-l border-border">
              <div className="flex flex-col space-y-4 mt-8">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      handleNavigation(item.href);
                      setIsOpen(false);
                    }}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 text-left cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="pt-4 border-t">
                  <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary/80" size="sm">
                    Sign In
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
