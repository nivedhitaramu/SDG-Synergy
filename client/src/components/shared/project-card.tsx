import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SDGBadge } from "./sdg-badge";
import { HelpOfferDialog } from "./help-offer-dialog";
import type { Project } from "@shared/schema";
import { Users, LogIn, HandHeart, Wrench, DollarSign, GraduationCap, UserCheck, Megaphone, Scale } from "lucide-react";
import { useJoinProject } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";

const HELP_TYPE_ICONS: Record<string, any> = {
  "Technical": Wrench,
  "Funding": DollarSign,
  "Mentorship": GraduationCap,
  "Volunteers": UserCheck,
  "Marketing": Megaphone,
  "Legal": Scale,
};

export function ProjectCard({ project }: { project: Project }) {
  const joinProject = useJoinProject();
  const { user } = useAuth();
  const [activeHelpType, setActiveHelpType] = useState<string | null>(null);

  const isMember = user && project.members.includes(user.id);
  const isOwner = user && project.ownerId === user.id;
  const helpTypes: string[] = (project as any).helpTypes || [];
  const helpNeeded: boolean = (project as any).helpNeeded ?? false;

  return (
    <>
      <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/60">
        <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-xl line-clamp-2">{project.title}</h3>
              {helpNeeded && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    <HandHeart className="w-3 h-3" /> Help Wanted
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium bg-background px-2.5 py-1 rounded-full border border-border/50 whitespace-nowrap flex-shrink-0">
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

            {helpNeeded && helpTypes.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Click to offer help:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {helpTypes.map(type => {
                    const Icon = HELP_TYPE_ICONS[type] || HandHeart;
                    return (
                      <Badge
                        key={type}
                        data-testid={`help-tag-${project.id}-${type}`}
                        variant="outline"
                        onClick={() => !isOwner && setActiveHelpType(type)}
                        className={`text-xs gap-1 transition-all border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400
                          ${!isOwner ? "cursor-pointer hover:bg-orange-100 hover:scale-105 hover:shadow-sm active:scale-95" : "opacity-60 cursor-default"}`}
                      >
                        <Icon className="w-3 h-3" />
                        {type}
                      </Badge>
                    );
                  })}
                </div>
                {!isOwner && (
                  <p className="text-xs text-muted-foreground mt-1.5">Tap a tag to offer that specific help</p>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          {isOwner ? (
            <Button variant="secondary" className="w-full" disabled>Your Project</Button>
          ) : isMember ? (
            <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800" disabled>
              ✓ Contributing
            </Button>
          ) : helpNeeded ? (
            <Button
              data-testid={`offer-help-${project.id}`}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              onClick={() => helpTypes.length > 0 ? setActiveHelpType(helpTypes[0]) : joinProject.mutate(project.id)}
              disabled={joinProject.isPending}
            >
              <HandHeart className="w-4 h-4 mr-2" /> Offer Help
            </Button>
          ) : (
            <Button
              data-testid={`join-project-${project.id}`}
              className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
              onClick={() => joinProject.mutate(project.id)}
              disabled={joinProject.isPending}
            >
              <LogIn className="w-4 h-4 mr-2" /> Join Project
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Help Offer Dialog */}
      {activeHelpType && (
        <HelpOfferDialog
          open={!!activeHelpType}
          onClose={() => setActiveHelpType(null)}
          helpType={activeHelpType}
          project={project}
        />
      )}
    </>
  );
}
