import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  getApplications, markCompleted, getCertificateForApplication,
  VolunteerApplication, Certificate
} from "@/lib/volunteer-store";
import { useLocation } from "wouter";
import { HandHeart, Award, CalendarDays, Clock, CheckCircle2, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { SDG_DATA } from "@/lib/sdgs";
import { NGO_DATA } from "@/lib/ngo-data";
import { useToast } from "@/hooks/use-toast";

function ApplicationCard({
  app,
  onMarkComplete,
  onViewCert,
}: {
  app: VolunteerApplication;
  onMarkComplete: (app: VolunteerApplication) => void;
  onViewCert: (cert: Certificate) => void;
}) {
  const { t } = useTranslation();
  const cert = getCertificateForApplication(app.id);
  const ngoMeta = NGO_DATA.find(n => n.id === app.ngoId);

  return (
    <Card className="border border-border/60 hover-elevate" data-testid={`card-application-${app.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground">{app.projectName}</h3>
              {app.status === "completed" ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t("volunteerDashboard.completedStatus")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" /> {t("volunteerDashboard.pending")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-primary font-medium">{app.ngoName}</p>
          </div>
          {ngoMeta && (
            <div className="flex gap-1 shrink-0">
              {ngoMeta.sdgTags.slice(0, 2).map(id => {
                const sdg = SDG_DATA.find(s => s.id === id);
                return (
                  <span key={id} className="text-xs text-white px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: sdg?.color || "#22c55e" }}>
                    {id}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              <CalendarDays className="w-3 h-3 inline mr-1" />{t("volunteerDashboard.period")}
            </p>
            <p className="font-medium text-foreground">
              {format(new Date(app.startDate), "dd MMM yyyy")} → {format(new Date(app.endDate), "dd MMM yyyy")}
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {t("volunteerDashboard.appliedOn")}
            </p>
            <p className="font-medium text-foreground">
              {format(new Date(app.appliedAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        {app.availability && (
          <p className="text-xs text-muted-foreground mt-3">
            ⏰ {app.availability}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          {app.status === "pending" ? (
            <Button
              className="flex-1"
              onClick={() => onMarkComplete(app)}
              data-testid={`button-complete-${app.id}`}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("volunteerDashboard.markCompleted")}
            </Button>
          ) : cert ? (
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onViewCert(cert)}
              data-testid={`button-certificate-${app.id}`}>
              <Award className="w-4 h-4 mr-2" />
              {t("volunteerDashboard.downloadCertificate")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VolunteerHubPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [confirmApp, setConfirmApp] = useState<VolunteerApplication | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setApplications(getApplications());
  }, []);

  function handleMarkComplete(app: VolunteerApplication) {
    setConfirmApp(app);
  }

  function confirmComplete() {
    if (!confirmApp) return;
    markCompleted(confirmApp.id);
    setApplications(getApplications());
    setConfirmApp(null);
    toast({ title: "Volunteering marked as completed!", description: "Your certificate has been generated." });
  }

  const pending = applications.filter(a => a.status === "pending");
  const completed = applications.filter(a => a.status === "completed");

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <HandHeart className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">{t("volunteerDashboard.title")}</h1>
            </div>
            <p className="text-muted-foreground ml-14">{t("volunteerDashboard.subtitle")}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="text-center">
              <p className="text-2xl font-black text-foreground font-display">{pending.length}</p>
              <p className="text-xs text-muted-foreground">{t("volunteerDashboard.applied")}</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-green-600 font-display">{completed.length}</p>
              <p className="text-xs text-muted-foreground">{t("volunteerDashboard.completed")}</p>
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="bg-muted/50 p-6 rounded-2xl">
              <HandHeart className="w-16 h-16 text-muted-foreground/40 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No Applications Yet</h3>
            <p className="text-muted-foreground max-w-sm">{t("volunteerDashboard.noApplications")}</p>
            <Button onClick={() => setLocation("/ngos")}>
              {t("volunteerDashboard.browseNGOs")}
            </Button>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" /> {t("volunteerDashboard.applied")} ({pending.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {pending.map(app => (
                    <ApplicationCard key={app.id} app={app}
                      onMarkComplete={handleMarkComplete}
                      onViewCert={setSelectedCert} />
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> {t("volunteerDashboard.completed")} ({completed.length})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {completed.map(app => (
                    <ApplicationCard key={app.id} app={app}
                      onMarkComplete={handleMarkComplete}
                      onViewCert={setSelectedCert} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm complete dialog */}
      <Dialog open={!!confirmApp} onOpenChange={() => setConfirmApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("volunteerDashboard.confirmComplete")}</DialogTitle>
            <DialogDescription>
              {t("volunteerDashboard.confirmCompleteDesc", { project: confirmApp?.projectName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmApp(null)}>{t("common.cancel")}</Button>
            <Button onClick={confirmComplete} data-testid="button-confirm-complete">
              <CheckCircle2 className="w-4 h-4 mr-2" /> {t("volunteerDashboard.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate preview dialog */}
      {selectedCert && (
        <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </AppLayout>
  );
}

function CertificateModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> {t("certificate.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-8 bg-amber-50/30 dark:bg-amber-950/20 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🌿</span>
            <span className="font-display font-bold text-xl text-primary">SDG Synergy</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">{t("certificate.title")}</h2>
          <div className="w-16 h-0.5 bg-amber-400 mx-auto" />
          <p className="text-muted-foreground">{t("certificate.presentedTo")}</p>
          <p className="text-3xl font-display font-black text-foreground">{cert.volunteerName}</p>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            {t("certificate.body")} <strong className="text-foreground">{cert.projectName}</strong> {t("certificate.under")} <strong className="text-foreground">{cert.ngoName}</strong>{" "}
            {t("certificate.from")} <strong className="text-foreground">{cert.startDate}</strong> {t("certificate.to")} <strong className="text-foreground">{cert.endDate}</strong>.
          </p>
          <p className="text-muted-foreground text-sm">{t("certificate.body2")}</p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="bg-background/60 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{t("certificate.issueDate")}</p>
              <p className="font-medium text-foreground">{cert.issueDate}</p>
            </div>
            <div className="bg-background/60 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{t("certificate.certId")}</p>
              <p className="font-mono text-xs font-bold text-foreground">{cert.certId}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("certificate.issuedBy")}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>{t("common.close")}</Button>
          <Button onClick={() => { onClose(); setLocation(`/certificate/${cert.certId}`); }}>
            <FileText className="w-4 h-4 mr-2" /> {t("certificate.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
