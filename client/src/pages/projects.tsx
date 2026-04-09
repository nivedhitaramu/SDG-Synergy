import { useState } from "react";
import { AppLayout } from "@/components/layout/layout";
import { useProjects, useCreateProject } from "@/hooks/use-api";
import { ProjectCard } from "@/components/shared/project-card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, HandHeart, LayoutGrid, UserCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import { SDG_DATA } from "@/lib/sdgs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";

const HELP_TYPE_OPTIONS = ["Technical", "Funding", "Mentorship", "Volunteers", "Marketing", "Legal"];

const formSchema = insertProjectSchema.omit({ ownerId: true, members: true }).extend({
  helpNeeded: z.boolean().default(false),
  helpTypes: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      resourcesNeeded: "",
      resourcesOffered: "",
      sdgs: [],
      helpNeeded: false,
      helpTypes: [],
    }
  });

  const selectedSDGs = form.watch("sdgs");
  const helpNeeded = form.watch("helpNeeded");
  const selectedHelpTypes = form.watch("helpTypes");

  const toggleSDG = (id: number) => {
    const current = selectedSDGs || [];
    form.setValue("sdgs", current.includes(id) ? current.filter(s => s !== id) : [...current, id]);
  };

  const toggleHelpType = (type: string) => {
    const current = selectedHelpTypes || [];
    form.setValue("helpTypes", current.includes(type) ? current.filter(t => t !== type) : [...current, type]);
  };

  const onSubmit = (data: FormValues) => {
    createProject.mutate(
      { ...data, ownerId: 0, members: [] },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        }
      }
    );
  };

  const helpWantedProjects = projects?.filter(p => (p as any).helpNeeded) || [];
  const myProjects = projects?.filter(p => user && (p.ownerId === user.id || p.members.includes(user.id))) || [];
  const allProjects = projects || [];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Projects Board
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Join initiatives, offer your expertise, or launch your own project.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" /> Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Project Title</Label>
                <Input {...form.register("title")} placeholder="E.g. Clean River Initiative" data-testid="input-project-title" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...form.register("description")} placeholder="What is the goal of this project?" rows={4} data-testid="input-project-description" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resources Needed</Label>
                  <Input {...form.register("resourcesNeeded")} placeholder="E.g. Funding, Volunteers, Devs" />
                </div>
                <div className="space-y-2">
                  <Label>Resources Offered</Label>
                  <Input {...form.register("resourcesOffered")} placeholder="E.g. Mentorship, Network, Tools" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target SDGs</Label>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl border border-border">
                  {SDG_DATA.map(sdg => (
                    <Badge
                      key={sdg.id}
                      variant={selectedSDGs?.includes(sdg.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${selectedSDGs?.includes(sdg.id) ? 'shadow-md scale-105' : 'opacity-70 hover:opacity-100'}`}
                      style={{
                        backgroundColor: selectedSDGs?.includes(sdg.id) ? sdg.color : undefined,
                        borderColor: sdg.color,
                        color: selectedSDGs?.includes(sdg.id) ? 'white' : sdg.color
                      }}
                      onClick={() => toggleSDG(sdg.id)}
                    >
                      {sdg.id}. {sdg.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Help Wanted Toggle */}
              <div className="rounded-xl border border-border p-4 bg-orange-50/50 dark:bg-orange-900/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <HandHeart className="w-4 h-4 text-orange-600" />
                      This project needs help
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Let others know you're looking for contributors</p>
                  </div>
                  <Switch
                    data-testid="toggle-help-needed"
                    checked={helpNeeded}
                    onCheckedChange={(v) => form.setValue("helpNeeded", v)}
                  />
                </div>

                {helpNeeded && (
                  <div className="space-y-2">
                    <Label className="text-sm">What kind of help do you need?</Label>
                    <div className="flex flex-wrap gap-2">
                      {HELP_TYPE_OPTIONS.map(type => (
                        <Badge
                          key={type}
                          data-testid={`help-type-${type}`}
                          variant={selectedHelpTypes?.includes(type) ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${selectedHelpTypes?.includes(type)
                            ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
                            : 'border-orange-300 text-orange-700 hover:bg-orange-50'}`}
                          onClick={() => toggleHelpType(type)}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button data-testid="button-launch-project" type="submit" size="lg" disabled={createProject.isPending}>
                  {createProject.isPending ? "Creating..." : "Launch Project"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex items-center gap-1.5" data-testid="tab-all-projects">
            <LayoutGrid className="w-4 h-4" /> All Projects ({allProjects.length})
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-1.5" data-testid="tab-help-wanted">
            <HandHeart className="w-4 h-4 text-orange-500" />
            Help Wanted ({helpWantedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-1.5" data-testid="tab-my-projects">
            <UserCircle className="w-4 h-4" /> My Projects ({myProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* All Projects */}
        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl" />)}
            </div>
          ) : allProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          ) : (
            <EmptyState message="No projects yet. Be the first to start one!" />
          )}
        </TabsContent>

        {/* Help Wanted */}
        <TabsContent value="help" className="mt-0">
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 flex items-start gap-3">
            <HandHeart className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Offer your expertise</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                These projects are actively looking for contributors — technical help, mentorship, funding, volunteers and more.
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl" />)}
            </div>
          ) : helpWantedProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpWantedProjects.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          ) : (
            <EmptyState message="No projects need help right now. Check back soon!" />
          )}
        </TabsContent>

        {/* My Projects */}
        <TabsContent value="mine" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl" />)}
            </div>
          ) : myProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          ) : (
            <EmptyState message="You haven't joined or created any projects yet." />
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
      <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">{message}</p>
    </div>
  );
}
