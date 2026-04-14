import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/layout";
import { useMatches } from "@/hooks/use-api";
import { MatchCard } from "@/components/shared/match-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Target, MapPin, Building2, Star, Brain } from "lucide-react";
import { SDG_DATA } from "@/lib/sdgs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type AiSuggestion = {
  user: {
    id: number;
    name: string;
    orgType: string;
    location: string;
    sdgs: number[];
    expertise: string;
  };
  score: number;
  aiReason: string;
};

function SdgBadge({ id }: { id: number }) {
  const sdg = SDG_DATA.find(s => s.id === id);
  if (!sdg) return null;
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: sdg.color }}
    >
      SDG {id}
    </span>
  );
}

function AiSuggestionCard({ suggestion }: { suggestion: AiSuggestion }) {
  const { toast } = useToast();
  const { t } = useTranslation();

  const connectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/matches/request", { targetUserId: suggestion.user.id, aiReason: suggestion.aiReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches/ai-suggestions"] });
      toast({ title: t("matches.requestSent"), description: t("matches.requestSentDesc", { name: suggestion.user.name }) });
    },
    onError: () => {
      toast({ title: t("matches.failedConnect"), variant: "destructive" });
    }
  });

  return (
    <Card
      data-testid={`ai-suggestion-${suggestion.user.id}`}
      className="border border-border/60 hover:shadow-lg transition-all hover:border-primary/30"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground text-lg leading-tight">{suggestion.user.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{suggestion.user.orgType}</span>
              <MapPin className="w-3.5 h-3.5 ml-1" />
              <span>{suggestion.user.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full text-sm">
              <Star className="w-3.5 h-3.5" />
              {suggestion.score}%
            </div>
            <span className="text-xs text-muted-foreground">{t("matches.aiMatchScore")}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/40 rounded-lg p-3 border border-border/40">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1.5">
            <Brain className="w-3.5 h-3.5" />
            {t("matches.whyMatch")}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{suggestion.aiReason}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {suggestion.user.sdgs.slice(0, 4).map(id => <SdgBadge key={id} id={id} />)}
        </div>

        {suggestion.user.expertise && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            <span className="font-medium">{t("matches.expertise")}</span> {suggestion.user.expertise}
          </p>
        )}

        <Button
          data-testid={`connect-btn-${suggestion.user.id}`}
          className="w-full"
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
        >
          {connectMutation.isPending ? t("matches.sending") : t("matches.connect")}
        </Button>
      </CardContent>
    </Card>
  );
}

function AiSuggestionsTab() {
  const { t } = useTranslation();
  const { data: suggestions, isLoading, refetch, isFetching } = useQuery<AiSuggestion[]>({
    queryKey: ["/api/matches/ai-suggestions"],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading || isFetching) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 animate-pulse text-primary" />
          {t("matches.aiSearching")}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
        <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">{t("matches.noSuggestions")}</p>
        <p className="text-sm mt-1">{t("matches.noSuggestionsDesc")}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          {t("matches.refresh")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span dangerouslySetInnerHTML={{ __html: t("matches.aiFound", { count: `<strong>${suggestions.length}</strong>` }) }} />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="refresh-ai">
          {t("matches.refresh")}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map(s => <AiSuggestionCard key={s.user.id} suggestion={s} />)}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { t } = useTranslation();
  const { data: matches, isLoading } = useMatches();

  const pending = matches?.filter(m => m.status === 'pending') || [];
  const active = matches?.filter(m => m.status === 'active') || [];
  const rejected = matches?.filter(m => m.status === 'rejected') || [];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          {t("matches.title")}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("matches.subtitle")}</p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="mb-6 grid grid-cols-4 w-[500px]">
          <TabsTrigger value="ai" data-testid="tab-ai" className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {t("matches.tabAI")}
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">{t("matches.tabPending")} ({pending.length})</TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">{t("matches.tabActive")} ({active.length})</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">{t("matches.tabSkipped")} ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-0">
          <AiSuggestionsTab />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted/50 rounded-xl" />)}
            </div>
          ) : pending.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t("matches.noPending")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {active.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
              <p>{t("matches.noActive")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 opacity-70">
          {rejected.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejected.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
              <p>{t("matches.noSkipped")}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
