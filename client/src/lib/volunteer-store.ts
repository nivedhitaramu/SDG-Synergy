export interface VolunteerApplication {
  id: string;
  ngoId: string;
  ngoName: string;
  projectName: string;
  fullName: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  availability: string;
  skills: string;
  reason: string;
  appliedAt: string;
  status: "pending" | "completed";
  completedAt?: string;
  userId?: number;
}

export interface Certificate {
  certId: string;
  applicationId: string;
  volunteerName: string;
  projectName: string;
  ngoName: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  userId?: number;
}

const APPLICATIONS_KEY = "sdg_volunteer_applications";
const CERTIFICATES_KEY = "sdg_certificates";

export function getApplications(): VolunteerApplication[] {
  try {
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveApplication(app: VolunteerApplication): void {
  const apps = getApplications();
  const existing = apps.findIndex(a => a.id === app.id);
  if (existing >= 0) {
    apps[existing] = app;
  } else {
    apps.push(app);
  }
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

export function hasApplied(ngoId: string): boolean {
  return getApplications().some(a => a.ngoId === ngoId);
}

export function markCompleted(applicationId: string): Certificate {
  const apps = getApplications();
  const idx = apps.findIndex(a => a.id === applicationId);
  if (idx < 0) throw new Error("Application not found");

  apps[idx].status = "completed";
  apps[idx].completedAt = new Date().toISOString();
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));

  const app = apps[idx];
  const cert: Certificate = {
    certId: `SDGS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    applicationId,
    volunteerName: app.fullName,
    projectName: app.projectName,
    ngoName: app.ngoName,
    startDate: app.startDate,
    endDate: app.endDate,
    issueDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    userId: app.userId,
  };

  const certs: Certificate[] = JSON.parse(localStorage.getItem(CERTIFICATES_KEY) || "[]");
  certs.push(cert);
  localStorage.setItem(CERTIFICATES_KEY, JSON.stringify(certs));

  return cert;
}

export function getCertificateForApplication(applicationId: string): Certificate | undefined {
  const certs: Certificate[] = JSON.parse(localStorage.getItem(CERTIFICATES_KEY) || "[]");
  return certs.find(c => c.applicationId === applicationId);
}

export function generateApplicationId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
