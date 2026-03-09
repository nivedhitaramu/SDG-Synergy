import { AppLayout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SDGBadge } from "@/components/shared/sdg-badge";
import { Building2, MapPin, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <Card className="overflow-hidden border-border/50 shadow-xl shadow-black/5">
          <div className="h-32 bg-gradient-to-r from-primary to-secondary/80"></div>
          <CardContent className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl -mt-16 bg-muted">
                <AvatarFallback className="text-4xl font-display font-bold text-primary">
                  {user.name.substring(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-2 md:-mt-4 flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h1 className="text-3xl font-display font-bold">{user.name}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground mt-2 font-medium">
                      <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4"/> {user.orgType}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {user.location}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Calendar className="w-4 h-4" />
                    Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Recently'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-display">Expertise & Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Sustainable Development Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sdgs.map(id => (
                    <SDGBadge key={id} id={id} showLabel className="text-sm px-3 py-1" />
                  ))}
                  {user.sdgs.length === 0 && <span className="text-muted-foreground text-sm italic">No SDGs selected.</span>}
                </div>
              </div>
              
              <div className="pt-6 border-t border-border/50">
                <h3 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Offered Resources / Expertise</h3>
                <p className="text-foreground leading-relaxed">
                  {user.expertise || "No expertise detailed yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-display text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
