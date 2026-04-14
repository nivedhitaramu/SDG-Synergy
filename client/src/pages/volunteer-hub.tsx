import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  getApplications, markCompleted as markVolunteerCompleted,
  getCertificateForApplication, VolunteerApplication
} from "@/lib/volunteer-store";
import {
  getSubmissions, getCertificateForSubmission,
  updateSubmissionStatus, isCertificateEligible,
  HelpSubmission, SubmissionCertificate, SUBMISSION_TYPE_LABELS
} from "@/lib/help-submissions";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { HandHeart, Award, CalendarDays, Clock, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type UnifiedRecord = {
  id: string;
  projectName: string;
  ngoName: string;
  submissionType: string;
  startDate: string;
  endDate: string;
  appliedAt: string;
  status: "pending" | "completed";
  certificateEligible: boolean;
  certId?: string;
  source: "volunteer_store" | "help_submissions";
  raw: VolunteerApplication | HelpSubmission;
};

type AllCert = {
  certId: string;
  volunteerName: string;
  projectName: string;
  ngoName: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  source: "submission" | "legacy";
};

function certBelongsToUser(cert: any, userId: number, allSubs: any[]): boolean {
  // If the cert itself has a userId, use it directly
  if (cert.userId !== undefined) return cert.userId === userId;
  // Demo certs (no userId, no real submissionId) — exclude for all real users
  if (!cert.submissionId && !cert.applicationId) return false;
  // For submission-based certs: check linked submission's userId
  if (cert.submissionId) {
    const sub = allSubs.find((s: any) => s.id === cert.submissionId);
    if (sub) return sub.userId === userId;
    return false;
  }
  // For legacy certs: check linked submission by volunteerApplicationId
  if (cert.applicationId) {
    const sub = allSubs.find((s: any) => s.volunteerApplicationId === cert.applicationId);
    if (sub) return sub.userId === userId;
    return false;
  }
  return false;
}

function getAllCertificates(userId?: number): AllCert[] {
  if (!userId) return [];
  let allSubs: any[] = [];
  try { allSubs = JSON.parse(localStorage.getItem("sdg_help_submissions") || "[]"); } catch { /* ignore */ }

  const certs: AllCert[] = [];
  // New submission-based certs
  try {
    const subCerts: any[] = JSON.parse(localStorage.getItem("sdg_submission_certs") || "[]");
    for (const c of subCerts) {
      if (!certBelongsToUser(c, userId, allSubs)) continue;
      certs.push({ certId: c.certId, volunteerName: c.volunteerName, projectName: c.projectName, ngoName: c.ngoName, startDate: c.startDate, endDate: c.endDate, issueDate: c.issueDate, source: "submission" });
    }
  } catch { /* ignore */ }
  // Legacy volunteer-store certs
  try {
    const legacyCerts: any[] = JSON.parse(localStorage.getItem("sdg_certificates") || "[]");
    for (const c of legacyCerts) {
      if (!certBelongsToUser(c, userId, allSubs)) continue;
      if (!certs.find(x => x.certId === c.certId)) {
        certs.push({ certId: c.certId, volunteerName: c.volunteerName, projectName: c.projectName, ngoName: c.ngoName, startDate: c.startDate, endDate: c.endDate, issueDate: c.issueDate, source: "legacy" });
      }
    }
  } catch { /* ignore */ }
  return certs.sort((a, b) => b.certId.localeCompare(a.certId));
}

function CertCard({ cert, onView }: { cert: AllCert; onView: (certId: string) => void }) {
  const { t } = useTranslation();
  return (
    <Card className="border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card hover-elevate" data-testid={`card-cert-${cert.certId}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-amber-100 dark:bg-amber-900/40 p-2.5 rounded-xl shrink-0">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{cert.projectName}</h3>
            <p className="text-sm text-primary font-medium">{cert.ngoName}</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {t("status.completed")}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="font-semibold uppercase tracking-wider mb-0.5">{t("common.volunteer")}</p>
            <p className="font-medium text-foreground">{cert.volunteerName}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="font-semibold uppercase tracking-wider mb-0.5">{t("volunteerDashboard.completedOn")}</p>
            <p className="font-medium text-foreground">{cert.issueDate}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="font-semibold uppercase tracking-wider mb-0.5">{t("certificate.from")}</p>
            <p className="font-medium text-foreground">{cert.startDate}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="font-semibold uppercase tracking-wider mb-0.5">{t("certificate.to")}</p>
            <p className="font-medium text-foreground">{cert.endDate}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onView(cert.certId)} data-testid={`button-view-cert-${cert.certId}`}>
            <FileText className="w-4 h-4 mr-1.5" /> {t("volunteerDashboard.viewCertificate")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {cert.certId}</p>
      </CardContent>
    </Card>
  );
}

function RecordCard({ record, onMarkComplete, onViewCert }: {
  record: UnifiedRecord;
  onMarkComplete: (record: UnifiedRecord) => void;
  onViewCert: (certId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border border-border/60 hover-elevate" data-testid={`card-application-${record.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-foreground">{record.projectName}</h3>
              {record.status === "completed" ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t("status.completed")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" /> {t("status.inProgress")}</Badge>
              )}
              {record.certificateEligible && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs border-amber-200">
                  <Award className="w-3 h-3 mr-1" /> {t("status.certificateEligible")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-primary font-medium">{record.ngoName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{record.submissionType}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5"><CalendarDays className="w-3 h-3 inline mr-1" />{t("volunteerDashboard.period")}</p>
            <p className="font-medium text-foreground text-xs">
              {record.startDate ? format(new Date(record.startDate), "dd MMM yy") : "—"} → {record.endDate ? format(new Date(record.endDate), "dd MMM yy") : "—"}
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">{t("volunteerDashboard.appliedOn")}</p>
            <p className="font-medium text-foreground text-xs">{formatDistanceToNow(new Date(record.appliedAt), { addSuffix: true })}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {record.status === "pending" ? (
            <Button className="flex-1" onClick={() => onMarkComplete(record)} data-testid={`button-complete-${record.id}`}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> {t("volunteerDashboard.markCompleted")}
            </Button>
          ) : record.certificateEligible && record.certId ? (
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onViewCert(record.certId!)} data-testid={`button-certificate-${record.id}`}>
              <Award className="w-4 h-4 mr-2" /> {t("volunteerDashboard.viewCertificate")}
            </Button>
          ) : record.status === "completed" ? (
            <p className="text-xs text-muted-foreground italic py-2">{t("status.completed")} · {t("volunteerDashboard.noCertificatesDesc")}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VolunteerHubPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [allCerts, setAllCerts] = useState<AllCert[]>([]);
  const [confirmRecord, setConfirmRecord] = useState<UnifiedRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "certificates">("applications");
  const [appFilter, setAppFilter] = useState<"all" | "pending" | "completed">("all");
  const { toast } = useToast();

  function loadData() {
    const unified: UnifiedRecord[] = [];

    // From volunteer-store (legacy)
    for (const app of getApplications()) {
      const certFromStore = getCertificateForApplication(app.id);
      unified.push({
        id: app.id,
        projectName: app.projectName,
        ngoName: app.ngoName,
        submissionType: "Volunteer Application",
        startDate: app.startDate,
        endDate: app.endDate,
        appliedAt: app.appliedAt,
        status: app.status === "completed" ? "completed" : "pending",
        certificateEligible: true,
        certId: certFromStore?.certId,
        source: "volunteer_store",
        raw: app,
      });
    }

    // From help-submissions — user's own submissions (by userId OR by all if no userId set)
    const allSubs = getSubmissions();
    const userSubs = user
      ? allSubs.filter(s => s.userId === user.id || s.userId === undefined)
      : allSubs;

    for (const sub of userSubs) {
      // Skip demo entries that have real volunteer names (they're not the current user)
      if (!sub.userId && sub.id.startsWith("demo_") && !sub.id.startsWith("demo_cert")) continue;
      const cert = sub.status === "completed" ? getCertificateForSubmission(sub.id) : undefined;
      unified.push({
        id: sub.id,
        projectName: sub.projectName,
        ngoName: sub.ngoName,
        submissionType: SUBMISSION_TYPE_LABELS[sub.submissionType as keyof typeof SUBMISSION_TYPE_LABELS] || sub.submissionType,
        startDate: sub.preferredStartDate,
        endDate: sub.preferredEndDate,
        appliedAt: sub.submittedAt,
        status: sub.status === "completed" ? "completed" : "pending",
        certificateEligible: sub.certificateEligible,
        certId: cert?.certId,
        source: "help_submissions",
        raw: sub,
      });
    }

    unified.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    setRecords(unified);
    setAllCerts(getAllCertificates(user?.id));
  }

  useEffect(() => { loadData(); }, [user]);

  // Listen for localStorage changes (when admin marks completed in another view)
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener("storage", handler);
    // Also poll every 5s in case same-tab updates
    const interval = setInterval(loadData, 5000);
    return () => { window.removeEventListener("storage", handler); clearInterval(interval); };
  }, [user]);

  function handleMarkComplete(record: UnifiedRecord) { setConfirmRecord(record); }

  function confirmComplete() {
    if (!confirmRecord) return;
    if (confirmRecord.source === "volunteer_store") {
      markVolunteerCompleted(confirmRecord.id);
    } else {
      updateSubmissionStatus(confirmRecord.id, "completed");
    }
    toast({ title: "Marked Completed!", description: "Certificate generated. Check the Certificates tab." });
    setConfirmRecord(null);
    loadData();
    setActiveTab("certificates");
  }

  function handleViewCert(certId: string) { setLocation(`/certificate/${certId}`); }

  const pending = records.filter(r => r.status === "pending");
  const completed = records.filter(r => r.status === "completed");
  const displayedApps = appFilter === "all" ? records : appFilter === "pending" ? pending : completed;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><HandHeart className="w-6 h-6" /></div>
              <h1 className="text-3xl font-display font-bold text-foreground">{t("volunteerDashboard.title")}</h1>
            </div>
            <p className="text-muted-foreground ml-14">{t("volunteerDashboard.subtitle")}</p>
          </div>
          <div className="flex gap-4 text-sm">
            {[
              { label: t("volunteerDashboard.tabApplications"), value: records.length, color: "text-foreground" },
              { label: t("status.completed"), value: completed.length, color: "text-green-600" },
              { label: t("volunteerDashboard.tabCertificates"), value: allCerts.length, color: "text-amber-600" },
            ].map((s, i) => (
              <div key={i} className={`text-center ${i > 0 ? "border-l border-border pl-4" : ""}`}>
                <p className={`text-2xl font-black font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border/60 pb-0">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${activeTab === "applications" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-applications"
          >
            <HandHeart className="w-4 h-4 inline mr-1.5" />{t("volunteerDashboard.tabApplications")} ({records.length})
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "certificates" ? "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-certificates"
          >
            <Award className="w-4 h-4" />{t("volunteerDashboard.tabCertificates")}
            {allCerts.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{allCerts.length}</span>
            )}
          </button>
        </div>

        {/* ── APPLICATIONS TAB ── */}
        {activeTab === "applications" && (
          <>
            {records.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="bg-muted/50 p-6 rounded-2xl"><HandHeart className="w-16 h-16 text-muted-foreground/40 mx-auto" /></div>
                <h3 className="text-xl font-bold text-foreground">No Applications Yet</h3>
                <p className="text-muted-foreground max-w-sm">{t("volunteerDashboard.noApplications")}</p>
                <Button onClick={() => setLocation("/ngos")}>{t("volunteerDashboard.browseNGOs")}</Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  {([["all", "All", records.length], ["pending", "In Progress", pending.length], ["completed", "Completed", completed.length]] as const).map(([filter, label, count]) => (
                    <Button key={filter} size="sm" variant={appFilter === filter ? "default" : "outline"} onClick={() => setAppFilter(filter)}>
                      {label} ({count})
                    </Button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {displayedApps.map(record => (
                    <RecordCard key={record.id} record={record} onMarkComplete={handleMarkComplete} onViewCert={handleViewCert} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── CERTIFICATES TAB ── */}
        {activeTab === "certificates" && (
          <>
            {allCerts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800">
                  <Award className="w-16 h-16 text-amber-400/50 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Certificates Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Complete a volunteering or contribution — once marked completed by the project owner, your certificate will appear here.
                </p>
                <Button onClick={() => setActiveTab("applications")}>View My Applications</Button>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Your Certificates of Appreciation</p>
                    <p className="text-sm text-muted-foreground">These certificates recognise your completed volunteering and contribution work across NGO and project activities.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {allCerts.map(cert => (
                    <CertCard key={cert.certId} cert={cert} onView={handleViewCert} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Confirm complete */}
      <Dialog open={!!confirmRecord} onOpenChange={() => setConfirmRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("volunteerDashboard.confirmComplete")}</DialogTitle>
            <DialogDescription>{t("volunteerDashboard.confirmCompleteDesc", { project: confirmRecord?.projectName })}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRecord(null)}>{t("common.cancel")}</Button>
            <Button onClick={confirmComplete} data-testid="button-confirm-complete">
              <CheckCircle2 className="w-4 h-4 mr-2" /> {t("volunteerDashboard.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
