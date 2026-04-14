import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getSubmissions, getNotifications, updateSubmissionStatus, markNotificationRead,
  markAllNotificationsRead, HelpSubmission, AppNotification,
  SUBMISSION_TYPE_LABELS, STATUS_COLORS, SubmissionStatus,
  getCertificateForSubmission, isCertificateEligible, generateCertificateFromSubmission, SubmissionCertificate
} from "@/lib/help-submissions";
import { formatDistanceToNow, format } from "date-fns";
import {
  Users, Inbox, CheckCircle2, Clock, Bell, BellOff, Search, Filter,
  Mail, Phone, Copy, ExternalLink, Award, ChevronRight, X, Loader2,
  FileText, AlertCircle, HandHeart, Building2
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_OPTIONS: { value: SubmissionStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: STATUS_COLORS.new },
  { value: "reviewed", label: "Reviewed", color: STATUS_COLORS.reviewed },
  { value: "contacted", label: "Contacted", color: STATUS_COLORS.contacted },
  { value: "approved", label: "Approved", color: STATUS_COLORS.approved },
  { value: "rejected", label: "Rejected", color: STATUS_COLORS.rejected },
  { value: "completed", label: "Completed", color: STATUS_COLORS.completed },
];

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${opt?.color}`}>
      {opt?.label || status}
    </span>
  );
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (open) setNotifications(getNotifications());
  }, [open]);

  function handleRead(n: AppNotification) {
    markNotificationRead(n.id);
    setNotifications(getNotifications());
  }

  function handleMarkAll() {
    markAllNotificationsRead();
    setNotifications(getNotifications());
  }

  const unread = notifications.filter(n => !n.read).length;

  if (!open) return null;

  return (
    <div className="absolute right-0 top-12 z-50 w-96 bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Notifications</span>
          {unread > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={handleMarkAll}>
              Mark all read
            </Button>
          )}
          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            className={`p-4 cursor-pointer hover:bg-muted/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
            onClick={() => handleRead(n)}
          >
            <div className="flex gap-3 items-start">
              {!n.read ? (
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
              ) : (
                <div className="w-2 h-2 bg-transparent rounded-full mt-1.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionDetailModal({
  sub, open, onClose, onStatusChange
}: {
  sub: HelpSubmission | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (sub) setNotes(sub.notes || "");
  }, [sub]);

  if (!sub) return null;

  const cert = getCertificateForSubmission(sub.id);
  const EMAIL_STATUSES: SubmissionStatus[] = ["reviewed", "contacted", "approved", "rejected", "completed"];

  async function handleStatusChange(status: SubmissionStatus) {
    if (!sub) return;
    setUpdatingStatus(true);
    const generatedCert = updateSubmissionStatus(sub.id, status);

    const shouldEmail = EMAIL_STATUSES.includes(status) && !!sub.applicantEmail;

    if (shouldEmail) {
      try {
        await fetch("/api/submissions/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sub.applicantEmail,
            applicantName: sub.applicantName,
            projectName: sub.projectName,
            ngoName: sub.ngoName,
            status,
            helpCategory: sub.helpCategory,
            certId: generatedCert?.certId || cert?.certId || undefined,
          }),
        });
      } catch { /* email failure is non-blocking */ }
    }

    const statusLabels: Record<string, string> = {
      reviewed: "Application marked as reviewed.",
      contacted: "Marked as contacted.",
      approved: "Application approved!",
      rejected: "Application rejected.",
      completed: "Marked as completed.",
      new: "Status reset to new.",
    };

    const emailNote = shouldEmail ? " Notification email sent to applicant." : "";

    if (status === "completed" && isCertificateEligible(sub)) {
      toast({
        title: "Marked Completed",
        description: (generatedCert ? "Certificate generated for volunteer." : "Status updated.") + emailNote,
      });
    } else if (status === "approved") {
      toast({ title: "🎉 Application Approved!", description: `${sub.applicantName} has been accepted.${emailNote}` });
    } else {
      toast({ title: "Status Updated", description: (statusLabels[status] || `Marked as ${status}.`) + emailNote });
    }

    setUpdatingStatus(false);
    onStatusChange();
  }

  function handleSaveNotes() {
    if (!sub) return;
    setSavingNotes(true);
    updateSubmissionStatus(sub.id, sub.status, notes);
    setTimeout(() => {
      setSavingNotes(false);
      toast({ title: "Notes saved" });
      onStatusChange();
    }, 300);
  }

  function copyContact() {
    const text = `Name: ${sub.applicantName}\nEmail: ${sub.applicantEmail}\nPhone: ${sub.applicantPhone}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Contact details copied!" });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{sub.applicantName}</span>
            <StatusBadge status={sub.status} />
          </DialogTitle>
          <DialogDescription>
            {SUBMISSION_TYPE_LABELS[sub.submissionType]} — {sub.projectName} · {sub.ngoName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Contact section */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                <p className="font-semibold text-foreground">{sub.applicantName}</p>
              </div>
              {sub.organizationName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Organisation</p>
                  <p className="font-semibold text-foreground">{sub.organizationName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <a href={`mailto:${sub.applicantEmail}`}
                  className="text-primary hover:underline font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {sub.applicantEmail}
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <a href={`tel:${sub.applicantPhone}`}
                  className="text-primary hover:underline font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {sub.applicantPhone}
                </a>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={copyContact} data-testid="button-copy-contact">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Contact
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${sub.applicantEmail}`}><Mail className="w-3.5 h-3.5 mr-1.5" /> Email</a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${sub.applicantPhone}`}><Phone className="w-3.5 h-3.5 mr-1.5" /> Call</a>
              </Button>
            </div>
          </div>

          {/* Submission details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Help Category</p>
              <p className="text-foreground">{sub.helpCategory}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Source Form</p>
              <p className="text-foreground">{sub.sourceForm}</p>
            </div>
            {sub.preferredStartDate && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Start Date</p>
                <p className="text-foreground">{sub.preferredStartDate}</p>
              </div>
            )}
            {sub.preferredEndDate && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">End Date</p>
                <p className="text-foreground">{sub.preferredEndDate}</p>
              </div>
            )}
            {sub.availability && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Availability</p>
                <p className="text-foreground">{sub.availability}</p>
              </div>
            )}
            {sub.skillsOffered && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Skills / Offered Support</p>
                <p className="text-foreground">{sub.skillsOffered}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Message / Reason</p>
              <p className="text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{sub.message}</p>
            </div>
          </div>

          {/* Source badge */}
          {sub.sourceForm && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Source:</span>
              <span className="bg-muted px-2 py-0.5 rounded font-medium text-foreground">{sub.sourceForm}</span>
            </div>
          )}

          {/* Quick Accept / Reject CTA for actionable statuses */}
          {(sub.status === "new" || sub.status === "reviewed" || sub.status === "contacted") && (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleStatusChange("approved")}
                disabled={updatingStatus}
                data-testid="button-quick-approve"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept Application
              </Button>
              <Button
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 dark:border-red-800"
                variant="outline"
                onClick={() => handleStatusChange("rejected")}
                disabled={updatingStatus}
                data-testid="button-quick-reject"
              >
                <X className="w-4 h-4 mr-1.5" /> Decline
              </Button>
            </div>
          )}

          {/* Status controls */}
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={sub.status === opt.value || updatingStatus}
                  data-testid={`button-status-${opt.value}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    sub.status === opt.value
                      ? `${opt.color} border-transparent ring-2 ring-offset-1 ring-current`
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Changing status sends an email notification to the applicant.</p>
          </div>

          {/* Certificate actions */}
          {sub.certificateEligible && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">Certificate Eligible</p>
                    <p className="text-xs text-muted-foreground">This is a volunteer submission</p>
                  </div>
                </div>
                {cert ? (
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => { onClose(); setLocation(`/certificate/${cert.certId}`); }}>
                    <FileText className="w-4 h-4 mr-1.5" /> View Certificate
                  </Button>
                ) : sub.status !== "completed" ? (
                  <Button size="sm" onClick={() => handleStatusChange("completed")} disabled={updatingStatus}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Completed & Generate
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Certificate pending (volunteer needs to confirm from their hub)</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              className="mt-1.5"
              rows={3}
              placeholder="Add internal notes for your team…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              data-testid="input-submission-notes"
            />
            <Button size="sm" className="mt-2" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Save Notes
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-1 border-t border-border/60">
            Submitted {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })} via {sub.sourceForm}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SubmissionsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<HelpSubmission[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ngoFilter, setNgoFilter] = useState("all");
  const [selectedSub, setSelectedSub] = useState<HelpSubmission | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  function refresh() {
    setSubmissions(getSubmissions());
    setNotifications(getNotifications());
  }

  useEffect(() => {
    refresh();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      const matchSearch = search === "" ||
        s.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        s.projectName.toLowerCase().includes(search.toLowerCase()) ||
        s.ngoName.toLowerCase().includes(search.toLowerCase()) ||
        s.applicantEmail.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || s.submissionType === typeFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchNgo = ngoFilter === "all" || s.ngoId === ngoFilter;
      return matchSearch && matchType && matchStatus && matchNgo;
    });
  }, [submissions, search, typeFilter, statusFilter, ngoFilter]);

  const uniqueNGOs = useMemo(() => {
    const seen = new Set<string>();
    return submissions.filter(s => { const k = !seen.has(s.ngoId); seen.add(s.ngoId); return k; });
  }, [submissions]);

  const stats = useMemo(() => ({
    total: submissions.length,
    newCount: submissions.filter(s => s.status === "new").length,
    volunteers: submissions.filter(s => s.submissionType === "volunteer" || s.submissionType === "teaching").length,
    offerHelp: submissions.filter(s => s.submissionType === "offer_help" || s.submissionType === "food_drive" || s.submissionType === "water_support" || s.submissionType === "awareness").length,
    completed: submissions.filter(s => s.status === "completed").length,
  }), [submissions]);

  const SUBMISSION_TYPES = ["all", ...Array.from(new Set(submissions.map(s => s.submissionType)))];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Inbox className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">{t("submissions.title")}</h1>
            </div>
            <p className="text-muted-foreground ml-14">{t("submissions.subtitle")}</p>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              className="relative"
              onClick={() => setNotifOpen(o => !o)}
              data-testid="button-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </Button>
            <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Submissions", value: stats.total, icon: Inbox, color: "text-blue-600" },
            { label: "New", value: stats.newCount, icon: AlertCircle, color: "text-orange-500" },
            { label: "Volunteers", value: stats.volunteers, icon: HandHeart, color: "text-primary" },
            { label: "Offer Help", value: stats.offerHelp, icon: Building2, color: "text-purple-600" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label} className="border border-border/60 hover-elevate">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
                <div>
                  <p className="text-2xl font-black text-foreground font-display">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, NGO, project…"
              value={search} onChange={e => setSearch(e.target.value)} data-testid="input-submissions-search" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)} data-testid="select-type-filter">
              <option value="all">All Types</option>
              {SUBMISSION_TYPES.filter(t => t !== "all").map(t => (
                <option key={t} value={t}>{SUBMISSION_TYPE_LABELS[t as keyof typeof SUBMISSION_TYPE_LABELS] || t}</option>
              ))}
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)} data-testid="select-status-filter">
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={ngoFilter} onChange={e => setNgoFilter(e.target.value)} data-testid="select-ngo-filter">
              <option value="all">All NGOs</option>
              {uniqueNGOs.map(s => <option key={s.ngoId} value={s.ngoId}>{s.ngoName}</option>)}
            </select>
          </div>
        </div>

        {/* Table / Card list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No submissions match your filters.</p>
            <Button variant="outline" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setNgoFilter("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60">
                    {["Applicant", "Type", "NGO / Project", "Skills Offered", "Dates", "Status", "Submitted", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub, i) => (
                    <tr key={sub.id}
                      className={`border-b border-border/40 hover:bg-muted/20 cursor-pointer transition-colors ${i % 2 ? "bg-muted/10" : ""}`}
                      onClick={() => setSelectedSub(sub)}
                      data-testid={`row-submission-${sub.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{sub.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{sub.applicantEmail}</p>
                        <p className="text-xs text-muted-foreground">{sub.applicantPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                          {SUBMISSION_TYPE_LABELS[sub.submissionType]}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                            sub.sourceForm?.includes("Projects Dashboard")
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          }`}>
                            {sub.sourceForm?.includes("Projects Dashboard") ? "Project" : "NGO Hub"}
                          </span>
                          {sub.certificateEligible && (
                            <Award className="w-3.5 h-3.5 text-amber-500" title="Certificate eligible" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{sub.ngoName}</p>
                        <p className="text-xs text-muted-foreground">{sub.projectName}</p>
                      </td>
                      <td className="px-4 py-3 max-w-36">
                        <p className="text-xs text-muted-foreground truncate">{sub.skillsOffered || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {sub.preferredStartDate ? (
                          <>{sub.preferredStartDate}<br />→ {sub.preferredEndDate}</>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(sub => (
                <Card key={sub.id} className="border border-border/60 cursor-pointer hover-elevate"
                  onClick={() => setSelectedSub(sub)} data-testid={`card-submission-${sub.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <p className="font-bold text-foreground">{sub.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{sub.ngoName} — {sub.projectName}</p>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{sub.applicantEmail}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{sub.applicantPhone}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                        {SUBMISSION_TYPE_LABELS[sub.submissionType]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <SubmissionDetailModal
        sub={selectedSub}
        open={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        onStatusChange={() => { refresh(); if (selectedSub) setSelectedSub(getSubmissions().find(s => s.id === selectedSub.id) || null); }}
      />
    </AppLayout>
  );
}
