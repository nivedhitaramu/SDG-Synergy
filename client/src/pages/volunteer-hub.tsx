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
  getSubmissionsByUser, getSubmissions, getCertificateForSubmission,
  generateCertificateFromSubmission, updateSubmissionStatus,
  isCertificateEligible, HelpSubmission, SubmissionCertificate,
  SUBMISSION_TYPE_LABELS
} from "@/lib/help-submissions";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { HandHeart, Award, CalendarDays, Clock, CheckCircle2, FileText, Inbox, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { SDG_DATA } from "@/lib/sdgs";
import { NGO_DATA } from "@/lib/ngo-data";
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
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t("volunteerDashboard.completedStatus")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" /> {t("volunteerDashboard.pending")}
                </Badge>
              )}
              {record.certificateEligible && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs border-amber-200">
                  <Award className="w-3 h-3 mr-1" /> Certificate Eligible
                </Badge>
              )}
            </div>
            <p className="text-sm text-primary font-medium">{record.ngoName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{record.submissionType}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              <CalendarDays className="w-3 h-3 inline mr-1" />{t("volunteerDashboard.period")}
            </p>
            <p className="font-medium text-foreground text-xs">
              {record.startDate ? format(new Date(record.startDate), "dd MMM yyyy") : "—"} →{" "}
              {record.endDate ? format(new Date(record.endDate), "dd MMM yyyy") : "—"}
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {t("volunteerDashboard.appliedOn")}
            </p>
            <p className="font-medium text-foreground text-xs">
              {formatDistanceToNow(new Date(record.appliedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {record.status === "pending" ? (
            <Button className="flex-1" onClick={() => onMarkComplete(record)} data-testid={`button-complete-${record.id}`}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> {t("volunteerDashboard.markCompleted")}
            </Button>
          ) : record.certificateEligible && record.certId ? (
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onViewCert(record.certId!)} data-testid={`button-certificate-${record.id}`}>
              <Award className="w-4 h-4 mr-2" /> {t("volunteerDashboard.downloadCertificate")}
            </Button>
          ) : record.status === "completed" && record.certificateEligible ? (
            <p className="text-xs text-muted-foreground italic py-2">Certificate pending NGO confirmation</p>
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
  const [confirmRecord, setConfirmRecord] = useState<UnifiedRecord | null>(null);
  const [viewCertId, setViewCertId] = useState<string | null>(null);
  const [viewCertData, setViewCertData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all");
  const { toast } = useToast();

  function buildRecords() {
    const unified: UnifiedRecord[] = [];

    // From volunteer-store
    const apps = getApplications();
    for (const app of apps) {
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

    // From help-submissions — filter by current user id OR by userId match
    const allSubs = getSubmissions();
    const userSubs = user
      ? allSubs.filter(s => s.userId === user.id)
      : [];

    for (const sub of userSubs) {
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

    // Sort by appliedAt descending
    unified.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    setRecords(unified);
  }

  useEffect(() => {
    buildRecords();
  }, [user]);

  function handleMarkComplete(record: UnifiedRecord) {
    setConfirmRecord(record);
  }

  function confirmComplete() {
    if (!confirmRecord) return;
    if (confirmRecord.source === "volunteer_store") {
      const cert = markVolunteerCompleted(confirmRecord.id);
      toast({ title: "Marked Completed!", description: "Certificate generated. Click Download Certificate." });
    } else {
      const cert = updateSubmissionStatus(confirmRecord.id, "completed");
      toast({ title: "Marked Completed!", description: cert ? "Certificate generated. Click Download Certificate." : "Status updated." });
    }
    setConfirmRecord(null);
    buildRecords();
  }

  function handleViewCert(certId: string) {
    setLocation(`/certificate/${certId}`);
  }

  const pending = records.filter(r => r.status === "pending");
  const completed = records.filter(r => r.status === "completed");
  const certReady = completed.filter(r => r.certificateEligible && r.certId);

  const displayed = activeTab === "all" ? records : activeTab === "pending" ? pending : completed;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <HandHeart className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">{t("volunteerDashboard.title")}</h1>
            </div>
            <p className="text-muted-foreground ml-14">{t("volunteerDashboard.subtitle")}</p>
          </div>
          <div className="flex gap-4 text-sm">
            {[
              { label: t("volunteerDashboard.applied"), value: pending.length, color: "text-foreground" },
              { label: t("volunteerDashboard.completed"), value: completed.length, color: "text-green-600" },
              { label: "Certificates", value: certReady.length, color: "text-amber-600" },
            ].map((s, i) => (
              <div key={i} className={`text-center ${i > 0 ? "border-l border-border pl-4" : ""}`}>
                <p className={`text-2xl font-black font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="bg-muted/50 p-6 rounded-2xl"><HandHeart className="w-16 h-16 text-muted-foreground/40 mx-auto" /></div>
            <h3 className="text-xl font-bold text-foreground">No Applications Yet</h3>
            <p className="text-muted-foreground max-w-sm">{t("volunteerDashboard.noApplications")}</p>
            <Button onClick={() => setLocation("/ngos")}>{t("volunteerDashboard.browseNGOs")}</Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2">
              {([["all", "All", records.length], ["pending", "In Progress", pending.length], ["completed", "Completed", completed.length]] as const).map(([tab, label, count]) => (
                <Button key={tab} size="sm" variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
                  {label} ({count})
                </Button>
              ))}
            </div>

            {/* Certificates highlight */}
            {certReady.length > 0 && activeTab !== "pending" && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-foreground">Certificates Ready</h3>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">{certReady.length}</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {certReady.map(r => (
                    <div key={r.id} className="bg-white dark:bg-card border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.projectName}</p>
                        <p className="text-xs text-muted-foreground">{r.ngoName}</p>
                      </div>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0" onClick={() => handleViewCert(r.certId!)}>
                        <FileText className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {displayed.map(record => (
                <RecordCard key={record.id} record={record} onMarkComplete={handleMarkComplete} onViewCert={handleViewCert} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirm complete dialog */}
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
