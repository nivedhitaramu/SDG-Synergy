import { useState } from "react";
import { AppLayout } from "@/components/layout/layout";
import { useEvents, useCreateEvent, useJoinEvent } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, Plus, Video, TreePine, BookOpen, Clock } from "lucide-react";
import { SDG_DATA } from "@/lib/sdgs";
import type { SDGEvent } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const EVENT_TYPES = [
  { value: "webinar", icon: Video, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "field_visit", icon: TreePine, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "workshop", icon: BookOpen, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
];

function getEventTypeInfo(type: string) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  eventType: z.enum(["webinar", "field_visit", "workshop"]),
  sdgs: z.array(z.number()).min(1, "Select at least 1 SDG").max(5, "Max 5 SDGs"),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(3, "Location is required"),
});

type FormValues = z.infer<typeof formSchema>;

function EventCard({ event, userId }: { event: SDGEvent; userId?: number }) {
  const { t } = useTranslation();
  const joinEvent = useJoinEvent();
  const isOrganizer = event.organizerId === userId;
  const isAttending = userId ? event.attendees.includes(userId) : false;
  const typeInfo = getEventTypeInfo(event.eventType);
  const TypeIcon = typeInfo.icon;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  const handleJoin = () => {
    if (!isAttending && !isOrganizer) {
      joinEvent.mutate(event.id);
    }
  };

  const attendeeCount = event.attendees.length;
  const attendeeLabel = attendeeCount === 1 ? t("events.attendee") : t("events.attendees");

  const typeLabel = event.eventType === "webinar"
    ? t("events.webinar")
    : event.eventType === "field_visit"
    ? t("events.fieldVisit")
    : t("events.workshop");

  return (
    <Card className="hover-elevate active-elevate-2 transition-all border border-border/60 overflow-hidden" data-testid={`card-event-${event.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                <TypeIcon className="w-3 h-3" />
                {typeLabel}
              </span>
              {isOrganizer && (
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                  {t("events.organizer")}
                </Badge>
              )}
              {isPast && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {t("events.past")}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground text-base leading-snug" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {event.sdgs.map(sdgId => {
            const sdg = SDG_DATA.find(s => s.id === sdgId);
            if (!sdg) return null;
            const SdgIcon = sdg.icon;
            return (
              <span
                key={sdgId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: sdg.color }}
                title={sdg.title}
                data-testid={`badge-sdg-${sdgId}-event-${event.id}`}
              >
                <SdgIcon className="w-3 h-3" /> SDG {sdgId}
              </span>
            );
          })}
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{eventDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 shrink-0" />
            <span>{attendeeCount} {attendeeLabel}</span>
          </div>
        </div>

        <div className="pt-1">
          {isOrganizer ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              {t("events.youreHosting")}
            </Button>
          ) : isAttending ? (
            <Button variant="outline" size="sm" className="w-full text-primary border-primary/40" disabled>
              {t("events.registered")}
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={handleJoin}
              disabled={joinEvent.isPending || isPast}
              data-testid={`button-join-event-${event.id}`}
            >
              {joinEvent.isPending ? t("events.registering") : isPast ? t("events.eventEnded") : t("events.registerNow")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateEventDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const createEvent = useCreateEvent();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "webinar",
      sdgs: [],
      date: "",
      location: "",
    }
  });

  const selectedSDGs = form.watch("sdgs");

  const toggleSDG = (id: number) => {
    const current = selectedSDGs || [];
    if (current.includes(id)) {
      form.setValue("sdgs", current.filter(s => s !== id));
    } else if (current.length < 5) {
      form.setValue("sdgs", [...current, id]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    await createEvent.mutateAsync({
      title: data.title,
      description: data.description,
      eventType: data.eventType,
      sdgs: data.sdgs,
      date: new Date(data.date),
      location: data.location,
    } as any);
    onClose();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">{t("events.eventTitle")}</Label>
        <Input id="title" placeholder={t("events.eventTitlePlaceholder")} {...form.register("title")} data-testid="input-event-title" />
        {form.formState.errors.title && <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>{t("events.eventType")}</Label>
        <Select defaultValue="webinar" onValueChange={val => form.setValue("eventType", val as any)}>
          <SelectTrigger data-testid="select-event-type">
            <SelectValue placeholder={t("events.eventTypeSelect")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="webinar">{t("events.webinar")}</SelectItem>
            <SelectItem value="field_visit">{t("events.fieldVisit")}</SelectItem>
            <SelectItem value="workshop">{t("events.workshop")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("events.description")}</Label>
        <Textarea id="description" placeholder={t("events.descriptionPlaceholder")} rows={3} {...form.register("description")} data-testid="input-event-description" />
        {form.formState.errors.description && <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">{t("events.dateTime")}</Label>
          <Input id="date" type="datetime-local" {...form.register("date")} data-testid="input-event-date" />
          {form.formState.errors.date && <p className="text-destructive text-xs">{form.formState.errors.date.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">{t("events.locationLink")}</Label>
          <Input id="location" placeholder={t("events.locationLinkPlaceholder")} {...form.register("location")} data-testid="input-event-location" />
          {form.formState.errors.location && <p className="text-destructive text-xs">{form.formState.errors.location.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("events.relatedSDGs")} <span className="text-muted-foreground text-xs">{t("events.selectSDGs")}</span></Label>
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {SDG_DATA.map(sdg => {
            const selected = selectedSDGs.includes(sdg.id);
            const SdgIcon = sdg.icon;
            return (
              <button
                key={sdg.id}
                type="button"
                onClick={() => toggleSDG(sdg.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium border transition-all ${
                  selected ? "text-white border-transparent" : "text-foreground border-border hover:border-primary/40"
                }`}
                style={selected ? { backgroundColor: sdg.color, borderColor: sdg.color } : {}}
                data-testid={`button-sdg-${sdg.id}`}
              >
                <SdgIcon className="w-3 h-3" /> SDG {sdg.id}
              </button>
            );
          })}
        </div>
        {form.formState.errors.sdgs && <p className="text-destructive text-xs">{form.formState.errors.sdgs.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={createEvent.isPending} data-testid="button-submit-event">
        {createEvent.isPending ? t("events.creating") : t("events.createEvent")}
      </Button>
    </form>
  );
}

export default function EventsPage() {
  const { t } = useTranslation();
  const { data: events, isLoading } = useEvents();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const myEvents = events?.filter(e => e.organizerId === user?.id || e.attendees.includes(user?.id ?? 0)) ?? [];
  const upcomingEvents = events?.filter(e => new Date(e.date) >= new Date()) ?? [];
  const pastEvents = events?.filter(e => new Date(e.date) < new Date()) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <span className="text-3xl">🗓️</span>
              {t("events.title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("events.subtitle")}</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-event">
                <Plus className="w-4 h-4" />
                {t("events.hostEvent")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("events.hostEventDialog")}</DialogTitle>
              </DialogHeader>
              <CreateEventDialog onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              {t("events.tabUpcoming")}
              {upcomingEvents.length > 0 && (
                <span className="ml-1.5 bg-primary/10 text-primary text-xs rounded-full px-1.5 py-0.5">{upcomingEvents.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mine" data-testid="tab-mine">
              {t("events.tabMine")}
              {myEvents.length > 0 && (
                <span className="ml-1.5 bg-primary/10 text-primary text-xs rounded-full px-1.5 py-0.5">{myEvents.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">{t("events.tabPast")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">{t("events.noUpcoming")}</p>
                <p className="text-sm mt-1">{t("events.noUpcomingDesc")}</p>
                <Button className="mt-4 gap-2" onClick={() => setOpen(true)}>
                  <Plus className="w-4 h-4" /> {t("events.hostAnEvent")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} userId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : myEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">{t("events.noMyEvents")}</p>
                <p className="text-sm mt-1">{t("events.noMyEventsDesc")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {myEvents.map(event => (
                  <EventCard key={event.id} event={event} userId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : pastEvents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">{t("events.noPast")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} userId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
