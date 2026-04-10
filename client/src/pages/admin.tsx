import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SDG_DATA } from "@/lib/sdgs";
import { formatDistanceToNow, format } from "date-fns";
import {
  Users, Briefcase, Handshake, CalendarDays, ShieldCheck,
  HandHeart, TrendingUp, MapPin, Building2, BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AdminStats = {
  totals: {
    users: number;
    projects: number;
    helpWantedProjects: number;
    matches: number;
    activeMatches: number;
    pendingMatches: number;
    events: number;
    upcomingEvents: number;
    verifiedUsers: number;
  };
  topSDGs: { id: number; count: number }[];
  orgTypes: Record<string, number>;
  topLocations: { city: string; count: number }[];
  helpTypes: Record<string, number>;
  growth: { date: string; count: number }[];
  recentUsers: {
    id: number; name: string; orgType: string; location: string;
    sdgs: number[]; createdAt: string; emailVerified: boolean;
  }[];
};

const ORG_TYPE_COLORS: Record<string, string> = {
  NGO: "bg-green-500",
  Individual: "bg-blue-500",
  Business: "bg-purple-500",
  Government: "bg-orange-500",
  Academic: "bg-pink-500",
  Other: "bg-gray-500",
};

const HELP_TYPE_COLORS: Record<string, string> = {
  Technical: "bg-blue-500",
  Funding: "bg-green-500",
  Mentorship: "bg-purple-500",
  Volunteers: "bg-orange-500",
  Marketing: "bg-pink-500",
  Legal: "bg-red-500",
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <Card className="border border-border/60 hover-elevate">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-black text-foreground mt-1 font-display">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`${color} p-2.5 rounded-xl text-white`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-foreground w-6 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

function GrowthChart({ growth }: { growth: { date: string; count: number }[] }) {
  const max = Math.max(...growth.map(g => g.count), 1);
  const recent = growth.slice(-14);
  return (
    <div className="flex items-end gap-1 h-24">
      {recent.map((g) => {
        const heightPct = Math.max((g.count / max) * 100, g.count > 0 ? 8 : 2);
        const isToday = g.date === new Date().toISOString().split('T')[0];
        return (
          <div key={g.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all ${isToday ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/60'}`}
              style={{ height: `${heightPct}%` }}
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
              {format(new Date(g.date), 'MMM d')}: {g.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load admin stats");
      return res.json();
    },
  });

  if (!user) return null;

  const maxSDG = stats ? Math.max(...stats.topSDGs.map(s => s.count), 1) : 1;
  const maxOrgType = stats ? Math.max(...Object.values(stats.orgTypes), 1) : 1;
  const maxHelpType = stats ? Math.max(...Object.values(stats.helpTypes), 1) : 1;
  const maxLocation = stats ? Math.max(...stats.topLocations.map(l => l.count), 1) : 1;

  return (
    <AppLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground ml-14">Platform activity, user growth, and SDG impact overview</p>
          </div>
          <Badge variant="outline" className="text-xs border-primary/40 text-primary px-3 py-1.5">
            🔒 Admin View
          </Badge>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.totals.users}
              sub={`${stats.totals.verifiedUsers} verified`} color="bg-blue-500" />
            <StatCard icon={Briefcase} label="Projects" value={stats.totals.projects}
              sub={`${stats.totals.helpWantedProjects} need help`} color="bg-purple-500" />
            <StatCard icon={Handshake} label="Connections" value={stats.totals.matches}
              sub={`${stats.totals.activeMatches} active`} color="bg-green-500" />
            <StatCard icon={CalendarDays} label="Events" value={stats.totals.events}
              sub={`${stats.totals.upcomingEvents} upcoming`} color="bg-orange-500" />
            <StatCard icon={ShieldCheck} label="Verified" value={`${Math.round((stats.totals.verifiedUsers / Math.max(stats.totals.users, 1)) * 100)}%`}
              sub="email-verified users" color="bg-teal-500" />
            <StatCard icon={HandHeart} label="Help Wanted" value={stats.totals.helpWantedProjects}
              sub="projects seeking help" color="bg-rose-500" />
            <StatCard icon={TrendingUp} label="Pending" value={stats.totals.pendingMatches}
              sub="match requests" color="bg-amber-500" />
            <StatCard icon={Building2} label="Org Types" value={Object.keys(stats.orgTypes).length}
              sub="types registered" color="bg-indigo-500" />
          </div>
        ) : null}

        {/* Row 2: User Growth + SDG Popularity */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* User Growth Chart */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> User Growth (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {isLoading ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : stats ? (
                <>
                  <GrowthChart growth={stats.growth} />
                  <div className="flex justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(stats.growth[0]?.date), 'MMM d')}
                    </span>
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {stats.growth.reduce((sum, g) => sum + g.count, 0)} new members in this period
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* SDG Popularity */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                🎯 Top SDGs by Community Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2">
              {isLoading ? (
                [...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 rounded" />)
              ) : stats?.topSDGs.slice(0, 8).map(s => {
                const sdg = SDG_DATA.find(d => d.id === s.id);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold text-white px-2 py-0.5 rounded w-20 text-center flex-shrink-0 truncate"
                      style={{ backgroundColor: sdg?.color || '#666' }}
                    >
                      SDG {s.id}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${(s.count / maxSDG) * 100}%`, backgroundColor: sdg?.color || '#22c55e' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-4 text-right flex-shrink-0">{s.count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Org Types + Locations + Help Types */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Org Type Breakdown */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Organisation Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2">
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 rounded" />)
              ) : stats ? (
                Object.entries(stats.orgTypes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <MiniBar
                      key={type} label={type} value={count} max={maxOrgType}
                      color={ORG_TYPE_COLORS[type] || "bg-gray-400"}
                    />
                  ))
              ) : null}
            </CardContent>
          </Card>

          {/* Top Locations */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2">
              {isLoading ? (
                [...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 rounded" />)
              ) : stats?.topLocations.map(l => (
                <MiniBar
                  key={l.city} label={l.city} value={l.count} max={maxLocation}
                  color="bg-primary"
                />
              ))}
            </CardContent>
          </Card>

          {/* Help Types */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HandHeart className="w-4 h-4 text-orange-500" /> Help Types Needed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2">
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 rounded" />)
              ) : stats && Object.keys(stats.helpTypes).length > 0 ? (
                Object.entries(stats.helpTypes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <MiniBar
                      key={type} label={type} value={count} max={maxHelpType}
                      color={HELP_TYPE_COLORS[type] || "bg-gray-400"}
                    />
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">No help-wanted projects yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Users Table */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Recent Members
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SDGs</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentUsers.map((u, i) => (
                      <tr key={u.id} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                        data-testid={`row-user-${u.id}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${ORG_TYPE_COLORS[u.orgType] || 'bg-gray-400'}`}>
                            {u.orgType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.location}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.sdgs.slice(0, 3).map(id => {
                              const sdg = SDG_DATA.find(s => s.id === id);
                              return (
                                <span key={id} className="text-xs text-white px-1.5 py-0.5 rounded font-medium"
                                  style={{ backgroundColor: sdg?.color || '#666' }}>
                                  {id}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.emailVerified ? (
                            <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
