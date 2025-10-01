import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { GraduationCap, FileText, Search } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-16 px-4 sm:py-20 sm:px-6 bg-gradient-to-b from-primary/10 to-background">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-xl sm:max-w-3xl">
          CareerPad — Explore, Build, and Launch Your Career with AI
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg max-w-md sm:max-w-2xl text-muted-foreground">
          CareerPad is your AI-powered companion for career exploration, resume building,  finding opportunities and more — all in one place.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">Get Started Free</Button>
          </Link>
          <Link href="/about" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-2xl sm:max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-16">
          Everything You Need to Shape Your Future
        </h2>
        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4 sm:p-6">
            <CardContent className="flex flex-col items-center text-center">
              <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg">Career Explorer</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                Browse career road maps with skills, salaries, and demand trends.
                Take our AI-powered quiz to discover paths that fit your strengths.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6">
            <CardContent className="flex flex-col items-center text-center">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg">Smart CV Builder</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                Create an ATS-friendly resume with AI-assisted bullet points,
                grammar checks, and keyword optimization. Export to PDF or DOCX.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-6">
            <CardContent className="flex flex-col items-center text-center">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg">Opportunities Feed</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                Find scholarships, internships, and competitions. Filter by
                deadline, region, or field, and save opportunities with reminders.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted">
        <div className="max-w-xl sm:max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12">How CareerPad Works</h2>
          <div className="grid gap-8 sm:gap-12 grid-cols-1 md:grid-cols-3 text-left">
            <div>
              <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2">1. Explore Careers</h3>
              <p className="text-xs sm:text-base text-muted-foreground">
                Dive into guides and compare different career paths. Let AI suggest
                roles based on your strengths and interests.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2">2. Build Your Resume</h3>
              <p className="text-xs sm:text-base text-muted-foreground">
                Use our guided resume builder to create a polished CV.
                AI enhances it with optimized bullet points and keywords.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg sm:text-xl mb-1 sm:mb-2">3. Find Opportunities</h3>
              <p className="text-xs sm:text-base text-muted-foreground">
                Browse the feed of scholarships, internships, and competitions.
                Save, filter, and get deadline reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 text-center bg-gradient-to-b from-background to-primary/10">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Start Building Your Career Today
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
          CareerPad helps you explore careers, craft a winning CV, and never miss an opportunity.
        </p>
        <Link href="/register"><Button size="lg" className="w-full sm:w-auto">Join Free Today</Button></Link>
      </section>
    </main>
  );
}
