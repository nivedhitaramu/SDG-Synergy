import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EarnedBadge } from "@shared/badges";
import { Trophy } from "lucide-react";

function BadgePill({ badge, size = "md" }: { badge: EarnedBadge; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-10 h-10 text-xl" : "w-14 h-14 text-3xl";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          data-testid={`badge-${badge.id}`}
          className={`
            ${sizeClass} rounded-2xl flex items-center justify-center cursor-default select-none
            transition-all duration-200
            ${badge.earned
              ? "shadow-md hover:scale-110 hover:shadow-lg"
              : "opacity-25 grayscale"
            }
          `}
          style={badge.earned ? { backgroundColor: badge.color + "22", border: `2px solid ${badge.color}66` } : { backgroundColor: "#88888822", border: "2px solid #88888833" }}
        >
          <span role="img" aria-label={badge.name}>{badge.emoji}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-center max-w-[180px]">
        <p className="font-semibold text-sm">{badge.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
        {!badge.earned && <p className="text-xs text-orange-500 mt-1 font-medium">Not yet earned</p>}
      </TooltipContent>
    </Tooltip>
  );
}

type Props = {
  userId: number;
  compact?: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  community: "Community",
  connections: "Connections",
  projects: "Projects",
  sdg: "SDG Focus",
};

export function BadgesSection({ userId, compact = false }: Props) {
  const { data: badges, isLoading } = useQuery<EarnedBadge[]>({
    queryKey: ["/api/badges", userId],
    queryFn: async () => {
      const res = await fetch(`/api/badges/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    staleTime: 30000,
  });

  const earned = badges?.filter(b => b.earned) || [];

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {[...Array(compact ? 5 : 8)].map((_, i) => (
          <Skeleton key={i} className={compact ? "w-10 h-10 rounded-2xl" : "w-14 h-14 rounded-2xl"} />
        ))}
      </div>
    );
  }

  if (!badges) return null;

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold text-foreground">
            {earned.length} / {badges.length} Badges
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map(badge => (
            <BadgePill key={badge.id} badge={badge} size="sm" />
          ))}
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(badges.map(b => b.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <span className="font-semibold text-foreground">
          {earned.length} earned · {badges.length - earned.length} to unlock
        </span>
      </div>

      {categories.map(cat => {
        const group = badges.filter(b => b.category === cat);
        return (
          <div key={cat}>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="flex flex-wrap gap-3">
              {group.map(badge => (
                <BadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
