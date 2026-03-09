import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SDGBadge } from "./sdg-badge";
import type { Project } from "@shared/schema";
import { Users, LogIn } from "lucide-react";
import { useJoinProject } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";

export function ProjectCard({ project }: { project: Project }) {
  const joinProject = useJoinProject();
  const { user } = useAuth();
  
  const isMember = user && project.members.includes(user.id);
  const isOwner = user && project.ownerId === user.id;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/60">
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-display font-bold text-xl line-clamp-2">{project.title}</h3>
          <div className="flex items-center gap-1 text-sm font-medium bg-background px-2.5 py-1 rounded-full border border-border/50 whitespace-nowrap">
            <Users className="w-4 h-4 text-muted-foreground" />
            {project.members.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {project.sdgs.map(sdg => (
            <SDGBadge key={sdg} id={sdg} />
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>

        <div className="mt-auto pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Needs</span>
              <span className="font-medium text-foreground">{project.resourcesNeeded}</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Offers</span>
              <span className="font-medium text-foreground">{project.resourcesOffered}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        {isOwner ? (
          <Button variant="secondary" className="w-full" disabled>Your Project</Button>
        ) : isMember ? (
          <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50 hover:bg-green-100" disabled>
            Joined
          </Button>
        ) : (
          <Button 
            className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground" 
            onClick={() => joinProject.mutate(project.id)}
            disabled={joinProject.isPending}
          >
            <LogIn className="w-4 h-4 mr-2" /> Join Project
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
