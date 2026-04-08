import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss, UserPlus, FolderPlus, Users } from "lucide-react";
import { SDG_DATA } from "@/lib/sdgs";
import { formatDistanceToNow } from "date-fns";

type FeedEvent = {
  id: number;
  type: string;
  userId: number;
  targetId: number | null;
  metadata: Record<string, any>;
  createdAt: string;
  user?: { id: number; name: string; orgType: string; location: string; sdgs: number[] };
  project?: { id: number; title: string; sdgs: number[] };
};

const EVENT_CONFIG: Record<string, { icon: any; color: string; label: (e: FeedEvent) => string }> = {
  user_joined: {
    icon: UserPlus,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    label: (e) => `${e.user?.name || "Someone"} joined as ${e.metadata.orgType || "member"} from ${e.metadata.location || "India"}`,
  },
  project_created: {
    icon: FolderPlus,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    label: (e) => `${e.user?.name || "Someone"} launched a new project: "${e.project?.title || e.metadata.projectTitle}"`,
  },
  project_joined: {
    icon: Users,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    label: (e) => `${e.user?.name || "Someone"} joined the project: "${e.project?.title || e.metadata.projectTitle}"`,
  },
};

function SdgPill({ id }: { id: number }) {
  const sdg = SDG_DATA.find(s => s.id === id);
  if (!sdg) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: sdg.color }}
    >
      {id}. {sdg.title}
    </span>
  );
}

function FeedCard({ event }: { event: FeedEvent }) {
  const config = EVENT_CONFIG[event.type];
  if (!config) return null;
  const Icon = config.icon;
  const sdgs: number[] = event.project?.sdgs || event.metadata?.sdgs || [];
  const timeAgo = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });

  return (
    <Card data-testid={`feed-event-${event.id}`} className="border border-border/60 hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {config.label(event)}
          </p>
          {sdgs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {sdgs.slice(0, 3).map(id => <SdgPill key={id} id={id} />)}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
        </div>
        {event.user?.orgType && (
          <Badge variant="outline" className="flex-shrink-0 h-fit text-xs">
            {event.user.orgType}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedPage() {
  const { data: events = [], isLoading } = useQuery<FeedEvent[]>({
    queryKey: ["/api/feed"],
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Rss className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SDG Impact Feed</h1>
            <p className="text-sm text-muted-foreground">Live activity from the SDG Synergy community</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Rss className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No activity yet</p>
            <p className="text-sm mt-1">Be the first — create a project or connect with someone!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <FeedCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
