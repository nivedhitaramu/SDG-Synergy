import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Building2, MapPin, Brain, Mail, Phone, Home, CheckCircle2 } from "lucide-react";
import { SDGBadge } from "./sdg-badge";
import type { MatchWithDetails } from "@shared/schema";
import { useUpdateMatchStatus } from "@/hooks/use-api";
import { useTranslation } from "react-i18next";

export function MatchCard({ match }: { match: MatchWithDetails }) {
  const updateMatch = useUpdateMatchStatus();
  const { t } = useTranslation();

  const otherUser = match.otherUser;
  if (!otherUser) return null;

  const scoreColor =
    match.score >= 80 ? "text-green-500 bg-green-500/10" :
    match.score >= 50 ? "text-yellow-500 bg-yellow-500/10" :
    "text-orange-500 bg-orange-500/10";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                {otherUser.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display font-bold text-lg">{otherUser.name}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5"/> {otherUser.orgType}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {otherUser.location}</span>
              </div>
            </div>
          </div>
          <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${scoreColor}`}>
            <span className="text-2xl font-display font-black leading-none">{match.score}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">Match</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground/80">{t("matches.sharedSDG")}</h4>
            <div className="flex flex-wrap gap-2">
              {otherUser.sdgs.map(sdg => (
                <SDGBadge key={sdg} id={sdg} />
              ))}
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
            <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">{t("matches.expertiseOffered")}</h4>
            <p className="text-sm font-medium">{otherUser.expertise}</p>
          </div>

          {match.aiReason && (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                <Brain className="w-3.5 h-3.5" /> {t("matches.aiMatchInsight")}
              </div>
              <p className="text-xs text-foreground/70 leading-relaxed">{match.aiReason}</p>
            </div>
          )}
        </div>
      </CardContent>

      {match.status === 'pending' && (
        <CardFooter className="p-4 pt-0 gap-3 border-t border-border/30 bg-muted/20">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => updateMatch.mutate({ id: match.id, status: 'rejected' })}
            disabled={updateMatch.isPending}
          >
            <X className="w-4 h-4 mr-2" /> {t("matches.skip")}
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => updateMatch.mutate({ id: match.id, status: 'active' })}
            disabled={updateMatch.isPending}
          >
            <Check className="w-4 h-4 mr-2" /> {t("matches.connect")}
          </Button>
        </CardFooter>
      )}

      {match.status === 'active' && (
        <CardFooter className="p-0 border-t border-green-200 dark:border-green-900/40 bg-green-500/5 flex-col items-stretch">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-green-200/60 dark:border-green-900/30">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t("matches.activeConnection")}</span>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            <a
              href={`mailto:${otherUser.email}`}
              data-testid={`contact-email-${match.id}`}
              className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-medium">{otherUser.email}</span>
            </a>
            <a
              href={`tel:${otherUser.phone}`}
              data-testid={`contact-phone-${match.id}`}
              className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Phone className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-medium">{otherUser.phone}</span>
            </a>
            <div
              data-testid={`contact-address-${match.id}`}
              className="flex items-start gap-2.5 text-sm text-foreground"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Home className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-medium">{otherUser.address}</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
