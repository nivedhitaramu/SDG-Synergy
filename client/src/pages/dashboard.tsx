import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/layout";
import { useMatches, useProjects } from "@/hooks/use-api";
import { MatchCard } from "@/components/shared/match-card";
import { ProjectCard } from "@/components/shared/project-card";
import { SDGBadge } from "@/components/shared/sdg-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Activity, Folders } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: matches, isLoading: isLoadingMatches } = useMatches();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  if (!user) return null;

  const pendingMatches = matches?.filter(m => m.status === 'pending') || [];
  const activeProjects = projects?.filter(p => p.members.includes(user.id)) || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground mt-1 text-lg">Here's your impact overview for today.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/projects">Find Projects</Link></Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Your SDGs</p>
                  <p className="text-3xl font-display font-black text-foreground mt-2">{user.sdgs.length}</p>
                </div>
                <div className="bg-primary/20 p-3 rounded-xl text-primary"><Activity className="w-5 h-5"/></div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {user.sdgs.slice(0, 3).map(id => <SDGBadge key={id} id={id} />)}
                {user.sdgs.length > 3 && <span className="text-xs font-medium text-muted-foreground pt-1">+{user.sdgs.length - 3} more</span>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-secondary/80 uppercase tracking-wider">Pending Matches</p>
                  <p className="text-3xl font-display font-black text-foreground mt-2">{pendingMatches.length}</p>
                </div>
                <div className="bg-secondary/20 p-3 rounded-xl text-secondary"><Sparkles className="w-5 h-5"/></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">Review and connect!</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-orange-600/80 uppercase tracking-wider">Active Projects</p>
                  <p className="text-3xl font-display font-black text-foreground mt-2">{activeProjects.length}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-xl text-orange-600"><Folders className="w-5 h-5"/></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">Collaborating for impact.</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">Top Pending Matches</h2>
            <Button asChild variant="link" className="text-primary"><Link href="/matches">View All</Link></Button>
          </div>
          
          {isLoadingMatches ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : pendingMatches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingMatches.slice(0, 3).map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No pending matches right now.</p>
                <p className="text-sm">We'll notify you when we find new synergistic partners.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Active Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">Your Projects</h2>
            <Button asChild variant="link" className="text-primary"><Link href="/projects">Explore More</Link></Button>
          </div>
          
          {isLoadingProjects ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : activeProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {activeProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Folders className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">You haven't joined any projects yet.</p>
                <Button asChild variant="outline" className="mt-4"><Link href="/projects">Find a Project</Link></Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
