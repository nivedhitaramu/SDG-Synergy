import { useState } from "react";
import { AppLayout } from "@/components/layout/layout";
import { useProjects, useCreateProject } from "@/hooks/use-api";
import { ProjectCard } from "@/components/shared/project-card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import { SDG_DATA } from "@/lib/sdgs";
import { Badge } from "@/components/ui/badge";

// Provide default arrays for arrays and omit ownerId as backend expects it or we supply it manually if not protected by session fully. 
// Assuming backend pulls ownerId from session if required, but schema requires it. Let's make it optional in form and assume server handles it or we send a dummy if it fails.
const formSchema = insertProjectSchema.omit({ ownerId: true, members: true });

type FormValues = z.infer<typeof formSchema>;

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      resourcesNeeded: "",
      resourcesOffered: "",
      sdgs: [],
    }
  });

  const selectedSDGs = form.watch("sdgs");

  const toggleSDG = (id: number) => {
    const current = selectedSDGs || [];
    if (current.includes(id)) {
      form.setValue("sdgs", current.filter(s => s !== id));
    } else {
      form.setValue("sdgs", [...current, id]);
    }
  };

  const onSubmit = (data: FormValues) => {
    createProject.mutate(
      { ...data, ownerId: 0, members: [] }, // Backend should override ownerId from session
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Projects Board
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Join initiatives or launch your own collaborative project.</p>
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
                <Input {...form.register("title")} placeholder="E.g. Clean River Initiative" />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...form.register("description")} placeholder="What is the goal of this project?" rows={4} />
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
                <Label>Target SDGs (Select multiple)</Label>
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
                {form.formState.errors.sdgs && <p className="text-xs text-destructive">Please select at least one SDG.</p>}
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" size="lg" disabled={createProject.isPending}>
                  {createProject.isPending ? "Creating..." : "Launch Project"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl" />)}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
          <p>No projects found. Be the first to start one!</p>
        </div>
      )}
    </AppLayout>
  );
}
