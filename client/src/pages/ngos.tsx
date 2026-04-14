import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NGO_DATA, NGO } from "@/lib/ngo-data";
import { SDG_DATA } from "@/lib/sdgs";
import { saveApplication, hasApplied, generateApplicationId, VolunteerApplication } from "@/lib/volunteer-store";
import { addSubmissionFromVolunteer } from "@/lib/help-submissions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, HandHeart, Building2, MapPin, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const SDG_CATEGORIES = [
  { label: "All SDGs", value: 0 },
  { label: "SDG 1 – No Poverty", value: 1 },
  { label: "SDG 2 – Zero Hunger", value: 2 },
  { label: "SDG 3 – Good Health", value: 3 },
  { label: "SDG 4 – Quality Education", value: 4 },
  { label: "SDG 5 – Gender Equality", value: 5 },
  { label: "SDG 6 – Clean Water", value: 6 },
  { label: "SDG 8 – Decent Work", value: 8 },
  { label: "SDG 10 – Reduced Inequalities", value: 10 },
  { label: "SDG 11 – Sustainable Cities", value: 11 },
  { label: "SDG 13 – Climate Action", value: 13 },
  { label: "SDG 15 – Life on Land", value: 15 },
  { label: "SDG 16 – Peace & Justice", value: 16 },
  { label: "SDG 17 – Partnerships", value: 17 },
];

function VolunteerFormModal({ ngo, open, onClose }: { ngo: NGO | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", startDate: "", endDate: "",
    availability: "", skills: "", reason: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ngo) return;
    const app: VolunteerApplication = {
      id: generateApplicationId(),
      ngoId: ngo.id,
      ngoName: ngo.ngoName,
      projectName: ngo.projectName,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      startDate: form.startDate,
      endDate: form.endDate,
      availability: form.availability,
      skills: form.skills,
      reason: form.reason,
      appliedAt: new Date().toISOString(),
      status: "pending",
      userId: user?.id,
    };
    saveApplication(app);
    addSubmissionFromVolunteer(app, user?.id);
    setSubmitted(true);
    toast({ title: t("volunteerForm.successTitle"), description: t("volunteerForm.successDesc", { project: ngo.projectName, ngo: ngo.ngoName }) });
  }

  function handleClose() {
    setSubmitted(false);
    setForm({ fullName: "", email: "", phone: "", startDate: "", endDate: "", availability: "", skills: "", reason: "" });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("volunteerForm.title")}</DialogTitle>
          <DialogDescription>
            {ngo ? `${ngo.ngoName} — ${ngo.projectName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold text-foreground">{t("volunteerForm.successTitle")}</h3>
            <p className="text-muted-foreground">{t("volunteerForm.successDesc", { project: ngo?.projectName, ngo: ngo?.ngoName })}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>{t("common.close")}</Button>
              <Button onClick={() => { handleClose(); setLocation("/volunteer-hub"); }}>
                Go to Volunteer Hub →
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fullName">{t("volunteerForm.fullName")} *</Label>
                <Input id="fullName" name="fullName" required placeholder={t("volunteerForm.fullNamePlaceholder")}
                  value={form.fullName} onChange={handleChange} data-testid="input-volunteer-name" />
              </div>
              <div>
                <Label htmlFor="email">{t("volunteerForm.email")} *</Label>
                <Input id="email" name="email" type="email" required placeholder={t("volunteerForm.emailPlaceholder")}
                  value={form.email} onChange={handleChange} data-testid="input-volunteer-email" />
              </div>
              <div>
                <Label htmlFor="phone">{t("volunteerForm.phone")} *</Label>
                <Input id="phone" name="phone" required placeholder={t("volunteerForm.phonePlaceholder")}
                  value={form.phone} onChange={handleChange} data-testid="input-volunteer-phone" />
              </div>
              <div>
                <Label htmlFor="startDate">{t("volunteerForm.startDate")} *</Label>
                <Input id="startDate" name="startDate" type="date" required
                  value={form.startDate} onChange={handleChange} data-testid="input-volunteer-start" />
              </div>
              <div>
                <Label htmlFor="endDate">{t("volunteerForm.endDate")} *</Label>
                <Input id="endDate" name="endDate" type="date" required
                  value={form.endDate} onChange={handleChange} data-testid="input-volunteer-end" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="availability">{t("volunteerForm.availability")} *</Label>
                <Input id="availability" name="availability" required placeholder={t("volunteerForm.availabilityPlaceholder")}
                  value={form.availability} onChange={handleChange} data-testid="input-volunteer-availability" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="skills">{t("volunteerForm.skills")}</Label>
                <Input id="skills" name="skills" placeholder={t("volunteerForm.skillsPlaceholder")}
                  value={form.skills} onChange={handleChange} data-testid="input-volunteer-skills" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="reason">{t("volunteerForm.reason")} *</Label>
                <Textarea id="reason" name="reason" required rows={3} placeholder={t("volunteerForm.reasonPlaceholder")}
                  value={form.reason} onChange={handleChange} data-testid="input-volunteer-reason" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1" data-testid="button-volunteer-submit">
                {t("common.submit")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CollabFormModal({ ngo, open, onClose }: { ngo: NGO | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    orgName: "", contactName: "", email: "", phone: "", proposal: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ngo) return;
    const sub = {
      id: `collab_${Date.now()}`,
      submissionType: "offer_help" as const,
      applicantName: form.contactName,
      applicantEmail: form.email,
      applicantPhone: form.phone,
      organizationName: form.orgName,
      ngoId: ngo.id,
      ngoName: ngo.ngoName,
      projectName: ngo.projectName,
      helpCategory: "Partnership / Collaboration",
      message: form.proposal,
      availability: "",
      skillsOffered: form.orgName,
      preferredStartDate: "",
      preferredEndDate: "",
      status: "new" as const,
      submittedAt: new Date().toISOString(),
      sourceForm: "NGO Directory — Request Collaboration",
      certificateEligible: false,
      userId: user?.id,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("sdg_help_submissions") || "[]");
      existing.unshift(sub);
      localStorage.setItem("sdg_help_submissions", JSON.stringify(existing));
    } catch { /* ignore */ }
    setSubmitted(true);
    toast({ title: "Collaboration request sent!", description: `Your request to partner with ${ngo.ngoName} has been submitted.` });
  }

  function handleClose() {
    setSubmitted(false);
    setForm({ orgName: "", contactName: "", email: "", phone: "", proposal: "" });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Collaboration</DialogTitle>
          <DialogDescription>
            {ngo ? `${ngo.ngoName} — ${ngo.projectName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold text-foreground">Request Sent!</h3>
            <p className="text-muted-foreground">Your collaboration request has been submitted to <strong>{ngo?.ngoName}</strong>. They will reach out to you soon.</p>
            <Button onClick={handleClose}>{t("common.close")}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="orgName">Organisation / Company Name *</Label>
                <Input id="orgName" name="orgName" required placeholder="Your organisation name"
                  value={form.orgName} onChange={handleChange} data-testid="input-collab-org" />
              </div>
              <div>
                <Label htmlFor="contactName">Contact Person *</Label>
                <Input id="contactName" name="contactName" required placeholder="Your full name"
                  value={form.contactName} onChange={handleChange} data-testid="input-collab-name" />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com"
                  value={form.email} onChange={handleChange} data-testid="input-collab-email" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+91 98765 43210"
                  value={form.phone} onChange={handleChange} data-testid="input-collab-phone" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="proposal">Collaboration Proposal *</Label>
                <Textarea id="proposal" name="proposal" required rows={4}
                  placeholder="Describe how you'd like to collaborate, what resources or expertise you can offer…"
                  value={form.proposal} onChange={handleChange} data-testid="input-collab-proposal" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1" data-testid="button-collab-submit">
                Send Request
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NGOCard({ ngo, onVolunteer, onCollab }: { ngo: NGO; onVolunteer: (ngo: NGO) => void; onCollab: (ngo: NGO) => void }) {
  const { t } = useTranslation();
  const applied = hasApplied(ngo.id);

  return (
    <Card className="border border-border/60 hover-elevate flex flex-col" data-testid={`card-ngo-${ngo.id}`}>
      <CardContent className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-foreground text-base leading-tight">{ngo.ngoName}</h3>
            <p className="text-sm text-primary font-medium mt-0.5">{ngo.projectName}</p>
          </div>
          <Badge
            className={`text-xs shrink-0 ${ngo.helpType === "requests_help"
              ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200"
              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200"}`}
          >
            {ngo.helpType === "requests_help" ? t("ngos.requestsHelp") : t("ngos.offersHelp")}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{ngo.description}</p>

        <div className="bg-muted/40 rounded-lg p-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {ngo.helpType === "requests_help" ? "🙏 " + t("ngos.helpDetails") : "🤝 " + t("ngos.helpDetails")}
          </p>
          <p className="text-foreground">{ngo.helpDetails}</p>
        </div>

        <div className="text-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            💡 {t("ngos.impact")}
          </p>
          <p className="text-foreground">{ngo.impact}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ngo.sdgTags.map(id => {
            const sdg = SDG_DATA.find(s => s.id === id);
            return (
              <span key={id} className="text-xs text-white px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: sdg?.color || "#22c55e" }}>
                SDG {id}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ngo.location}</span>
          {ngo.volunteerOpenings > 0 && (
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{ngo.volunteerOpenings} {t("ngos.volunteerOpenings")}</span>
          )}
        </div>

        <div className="mt-auto pt-2">
          {ngo.helpType === "requests_help" ? (
            applied ? (
              <Button variant="outline" className="w-full text-green-600 border-green-300" disabled data-testid={`button-applied-${ngo.id}`}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Applied ✓
              </Button>
            ) : (
              <Button className="w-full" onClick={() => onVolunteer(ngo)} data-testid={`button-volunteer-${ngo.id}`}>
                <HandHeart className="w-4 h-4 mr-2" /> {t("ngos.applyVolunteer")}
              </Button>
            )
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onCollab(ngo)} data-testid={`button-collab-${ngo.id}`}>
              <Building2 className="w-4 h-4 mr-2" /> {t("ngos.requestCollab")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NGOsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [helpFilter, setHelpFilter] = useState<"all" | "requests_help" | "offers_help">("all");
  const [sdgFilter, setSdgFilter] = useState(0);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [collabNGO, setCollabNGO] = useState<NGO | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);

  const filtered = NGO_DATA.filter(n => {
    const matchSearch = search === "" ||
      n.ngoName.toLowerCase().includes(search.toLowerCase()) ||
      n.projectName.toLowerCase().includes(search.toLowerCase());
    const matchHelp = helpFilter === "all" || n.helpType === helpFilter;
    const matchSDG = sdgFilter === 0 || n.sdgTags.includes(sdgFilter);
    return matchSearch && matchHelp && matchSDG;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{t("ngos.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("ngos.subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("ngos.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-ngo-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "requests_help", "offers_help"] as const).map(f => (
              <Button key={f} size="sm"
                variant={helpFilter === f ? "default" : "outline"}
                onClick={() => setHelpFilter(f)}
                data-testid={`button-filter-${f}`}>
                {f === "all" ? t("ngos.filterAll") : f === "requests_help" ? t("ngos.filterRequestsHelp") : t("ngos.filterOffersHelp")}
              </Button>
            ))}
            <select
              className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={sdgFilter}
              onChange={e => setSdgFilter(Number(e.target.value))}
              data-testid="select-sdg-filter">
              {SDG_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Showing <strong className="text-foreground">{filtered.length}</strong> of {NGO_DATA.length} organisations</span>
          <span className="text-orange-500">🙏 {NGO_DATA.filter(n => n.helpType === "requests_help").length} requesting help</span>
          <span className="text-green-600">🤝 {NGO_DATA.filter(n => n.helpType === "offers_help").length} offering help</span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">{t("ngos.noNGOs")}</p>
            <Button variant="outline" onClick={() => { setSearch(""); setHelpFilter("all"); setSdgFilter(0); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(ngo => (
              <NGOCard key={ngo.id} ngo={ngo}
                onVolunteer={n => { setSelectedNGO(n); setFormOpen(true); }}
                onCollab={n => { setCollabNGO(n); setCollabOpen(true); }} />
            ))}
          </div>
        )}
      </div>

      <VolunteerFormModal ngo={selectedNGO} open={formOpen} onClose={() => { setFormOpen(false); setSelectedNGO(null); }} />
      <CollabFormModal ngo={collabNGO} open={collabOpen} onClose={() => { setCollabOpen(false); setCollabNGO(null); }} />
    </AppLayout>
  );
}
