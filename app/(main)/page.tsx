// app/page.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, FileText, Search } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-b from-primary/10 to-background">
        <h1 className="text-5xl font-bold tracking-tight max-w-3xl">
          CareerPad — Explore, Build, and Launch Your Career with AI
        </h1>
        <p className="mt-6 text-lg max-w-2xl text-muted-foreground">
          CareerPad is your AI-powered companion for career exploration, resume building, and finding opportunities — all in one place.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/register"><Button size="lg">Get Started Free</Button></Link>
          <Link href="/about">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">
          Everything You Need to Shape Your Future
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <CardContent className="flex flex-col items-center text-center">
              <GraduationCap className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Career Explorer</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Browse career roadmaps with skills, salaries, and demand trends. 
                Take our AI-powered quiz to discover paths that fit your strengths.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="flex flex-col items-center text-center">
              <FileText className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Smart CV Builder</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create an ATS-friendly resume with AI-assisted bullet points, 
                grammar checks, and keyword optimization. Export to PDF or DOCX.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardContent className="flex flex-col items-center text-center">
              <Search className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Opportunities Feed</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Find scholarships, internships, and competitions. Filter by 
                deadline, region, or field, and save opportunities with reminders.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How CareerPad Works</h2>
          <div className="grid gap-12 md:grid-cols-3 text-left">
            <div>
              <h3 className="font-semibold text-xl mb-2">1. Explore Careers</h3>
              <p className="text-muted-foreground">
                Dive into guides and compare different career paths. Let AI suggest 
                roles based on your strengths and interests.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2">2. Build Your Resume</h3>
              <p className="text-muted-foreground">
                Use our guided resume builder to create a polished CV. 
                AI enhances it with optimized bullet points and keywords.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-2">3. Find Opportunities</h3>
              <p className="text-muted-foreground">
                Browse the feed of scholarships, internships, and competitions. 
                Save, filter, and get deadline reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-background to-primary/10">
        <h2 className="text-3xl font-bold mb-6">
          Start Building Your Career Today
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          CareerPad helps you explore careers, craft a winning CV, and never miss an opportunity.  
        </p>
        <Button size="lg">Join Free Today</Button>
      </section>
    </main>
  );
}
