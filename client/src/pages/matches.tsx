import { AppLayout } from "@/components/layout/layout";
import { useMatches } from "@/hooks/use-api";
import { MatchCard } from "@/components/shared/match-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target } from "lucide-react";

export default function MatchesPage() {
  const { data: matches, isLoading } = useMatches();

  const pending = matches?.filter(m => m.status === 'pending') || [];
  const active = matches?.filter(m => m.status === 'active') || [];
  const rejected = matches?.filter(m => m.status === 'rejected') || [];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Target className="w-8 h-8 text-primary" />
          Discover Matches
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Connect with synergistic partners based on your SDG focus.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6 grid grid-cols-3 w-[400px]">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="history">Skipped ({rejected.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-0">
          {isLoading ? (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
               {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl" />)}
             </div>
          ) : pending.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
              <p>No pending matches found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {active.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
              <p>No active connections yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 opacity-70">
           {rejected.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejected.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
              <p>No skipped matches.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
