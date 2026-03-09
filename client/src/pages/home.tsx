import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Target, Users, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl">SDG Synergy</span>
          </div>
          <div>
            <Button asChild variant="ghost" className="mr-2 hidden sm:inline-flex">
              <Link href="/auth">Log in</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Connect to achieve the <span className="text-gradient">Global Goals</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The intelligent matching platform for NGOs, businesses, and individuals to collaborate on Sustainable Development Goals.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Link href="/auth">Join the Network</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-muted/50">
              <Link href="/sdgs">Explore SDGs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-2xl border border-border/60 shadow-lg shadow-black/5">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Smart Matching</h3>
              <p className="text-muted-foreground">Our algorithm connects you with partners based on shared SDG focus and complementary resources.</p>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-border/60 shadow-lg shadow-black/5">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Project Collaboration</h3>
              <p className="text-muted-foreground">Create projects, request specific resources, and build cross-sector teams to multiply your impact.</p>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-border/60 shadow-lg shadow-black/5">
              <div className="w-12 h-12 bg-accent/20 text-accent-foreground rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Global Impact</h3>
              <p className="text-muted-foreground">Align your local initiatives with the UN's 17 Sustainable Development Goals framework seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-muted-foreground">
        <p>© 2024 SDG Synergy. Built for global impact.</p>
      </footer>
    </div>
  );
}
