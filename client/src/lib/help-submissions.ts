export type SubmissionType =
  | "volunteer"
  | "offer_help"
  | "collaboration"
  | "donation"
  | "teaching"
  | "medical"
  | "food_drive"
  | "water_support"
  | "awareness"
  | "other";

export type SubmissionStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "approved"
  | "rejected"
  | "completed";

export const CERTIFICATE_ELIGIBLE_TYPES: SubmissionType[] = [
  "volunteer",
  "teaching",
  "awareness",
  "other",
];

export interface HelpSubmission {
  id: string;
  submissionType: SubmissionType;
  projectId: string;
  projectName: string;
  ngoId: string;
  ngoName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  organizationName?: string;
  message: string;
  skillsOffered: string;
  availability: string;
  preferredStartDate: string;
  preferredEndDate: string;
  helpCategory: string;
  status: SubmissionStatus;
  submittedAt: string;
  completedAt?: string;
  sourceForm: string;
  notes: string;
  certificateEligible: boolean;
  volunteerApplicationId?: string;
  userId?: number;
}

export interface SubmissionCertificate {
  certId: string;
  submissionId: string;
  volunteerName: string;
  projectName: string;
  ngoName: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  userId?: number;
}

export interface AppNotification {
  id: string;
  message: string;
  submissionId: string;
  read: boolean;
  createdAt: string;
}

const SUBMISSIONS_KEY = "sdg_help_submissions";
const NOTIFICATIONS_KEY = "sdg_notifications";
const SUBMISSION_CERTS_KEY = "sdg_submission_certs";

const DEMO_SUBMISSIONS: HelpSubmission[] = [
  {
    id: "demo_001",
    submissionType: "volunteer",
    projectId: "bhumi",
    projectName: "Ignite Education Program",
    ngoId: "bhumi",
    ngoName: "Bhumi NGO",
    applicantName: "Priya Lakshmi",
    applicantEmail: "priya.lakshmi@gmail.com",
    applicantPhone: "+91 98432 10987",
    organizationName: "",
    message: "I am a final year B.Ed student passionate about teaching underprivileged children. I can teach English and Mathematics on weekends.",
    skillsOffered: "Teaching, English, Mathematics, Content Design",
    availability: "Weekends, 8–10 hours/week",
    preferredStartDate: "2026-05-01",
    preferredEndDate: "2026-07-31",
    helpCategory: "Volunteering",
    status: "new",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sourceForm: "NGO Directory – Volunteer Form",
    notes: "",
    certificateEligible: true,
  },
  {
    id: "demo_002",
    submissionType: "water_support",
    projectId: "tankers",
    projectName: "Clean Water Supply Initiative",
    ngoId: "tankers",
    ngoName: "Tankers Foundation",
    applicantName: "Rajesh Kumar",
    applicantEmail: "rajesh.k@civileng.in",
    applicantPhone: "+91 94431 87654",
    organizationName: "R.K. Infrastructure Pvt. Ltd.",
    message: "Our company can provide engineering support for water pipeline design and installation at cost.",
    skillsOffered: "Civil engineering, pipeline design, project management",
    availability: "Flexible, full-time availability for 2 months",
    preferredStartDate: "2026-05-15",
    preferredEndDate: "2026-07-15",
    helpCategory: "Technical & Engineering",
    status: "reviewed",
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    sourceForm: "NGO Directory – Offer Help",
    notes: "Looks very promising. Has corporate CSR budget as well.",
    certificateEligible: false,
  },
  {
    id: "demo_003",
    submissionType: "collaboration",
    projectId: "ecosocieties",
    projectName: "Environmental Awareness Programs",
    ngoId: "ecosocieties",
    ngoName: "Eco Societies India NGO",
    applicantName: "Ananya Krishnan",
    applicantEmail: "ananya@greencampus.org",
    applicantPhone: "+91 80122 33456",
    organizationName: "Green Campus Foundation",
    message: "We run an eco-awareness program in 20 colleges across Tamil Nadu. Would love to collaborate on joint campus drives.",
    skillsOffered: "Campus outreach, event planning, digital marketing",
    availability: "Monthly events, 2 days/month",
    preferredStartDate: "2026-06-01",
    preferredEndDate: "2026-12-31",
    helpCategory: "Awareness & Campaigns",
    status: "contacted",
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    sourceForm: "NGO Directory – Request Collaboration",
    notes: "Scheduled a call for April 20th.",
    certificateEligible: false,
  },
  {
    id: "demo_004",
    submissionType: "teaching",
    projectId: "panchayat",
    projectName: "Rural Learning Centers",
    ngoId: "panchayat",
    ngoName: "Panchayat Learning Center NGO",
    applicantName: "Mohammed Ishaan",
    applicantEmail: "ishaan.m@educate.in",
    applicantPhone: "+91 99003 44512",
    organizationName: "",
    message: "I am a software engineer who wants to teach basic digital literacy and coding fundamentals to rural children.",
    skillsOffered: "Python basics, digital literacy, Scratch programming",
    availability: "Saturday and Sunday, 4 hours/day",
    preferredStartDate: "2026-04-20",
    preferredEndDate: "2026-08-30",
    helpCategory: "Teaching Support",
    status: "approved",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sourceForm: "Projects Dashboard – Volunteer Form",
    notes: "Approved. Connecting with site coordinator Ravi.",
    certificateEligible: true,
  },
  {
    id: "demo_005",
    submissionType: "food_drive",
    projectId: "otrumai",
    projectName: "Community Support & Food Drives",
    ngoId: "otrumai",
    ngoName: "Otrumai NGO",
    applicantName: "Sneha Bala",
    applicantEmail: "sneha.b@youthclub.org",
    applicantPhone: "+91 78904 23456",
    organizationName: "Madurai Youth Club",
    message: "Our youth club has 40 active volunteers and we run monthly food drives.",
    skillsOffered: "Event coordination, cooking, logistics, social media promotion",
    availability: "Monthly, 1–2 days per event",
    preferredStartDate: "2026-05-01",
    preferredEndDate: "2026-10-31",
    helpCategory: "Food Drive Support",
    status: "new",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sourceForm: "NGO Directory – Offer Help",
    notes: "",
    certificateEligible: false,
  },
  // Pre-completed entries with certificates
  {
    id: "demo_cert_001",
    submissionType: "volunteer",
    projectId: "bhumi",
    projectName: "Ignite Education Program",
    ngoId: "bhumi",
    ngoName: "Bhumi NGO",
    applicantName: "Kavya Suresh",
    applicantEmail: "kavya.s@gmail.com",
    applicantPhone: "+91 98765 11223",
    organizationName: "",
    message: "Completed 3-month weekend teaching volunteering — Mathematics and Science for 8th standard.",
    skillsOffered: "Mathematics, Science, Student mentoring",
    availability: "Weekends",
    preferredStartDate: "2026-01-15",
    preferredEndDate: "2026-04-10",
    helpCategory: "Volunteering",
    status: "completed",
    submittedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    sourceForm: "NGO Directory – Volunteer Form",
    notes: "Excellent volunteer. Highly recommended.",
    certificateEligible: true,
  },
  {
    id: "demo_cert_002",
    submissionType: "teaching",
    projectId: "panchayat",
    projectName: "Rural Learning Centers",
    ngoId: "panchayat",
    ngoName: "Panchayat Learning Center NGO",
    applicantName: "Arjun Rajan",
    applicantEmail: "arjun.r@techteach.in",
    applicantPhone: "+91 91234 56789",
    organizationName: "",
    message: "Taught digital literacy and basic coding to 50 rural children across 2 villages in Vellore.",
    skillsOffered: "Digital literacy, Scratch, computer basics",
    availability: "Saturdays, 6 hours/day",
    preferredStartDate: "2026-02-01",
    preferredEndDate: "2026-04-01",
    helpCategory: "Teaching Support",
    status: "completed",
    submittedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sourceForm: "Projects Dashboard – Volunteer Form",
    notes: "Certificate generated. 50 children impacted.",
    certificateEligible: true,
  },
  {
    id: "demo_cert_003",
    submissionType: "awareness",
    projectId: "thuvakkam",
    projectName: "Blue Zone – Water Body Restoration",
    ngoId: "thuvakkam",
    ngoName: "Thuvakkam NGO",
    applicantName: "Divya Menon",
    applicantEmail: "divya.m@ecoclean.org",
    applicantPhone: "+91 87654 32109",
    organizationName: "Eco Clean Network",
    message: "Led 3 lake restoration awareness drives and coordinated cleanup events with 120 volunteers.",
    skillsOffered: "Community mobilisation, event management, social media",
    availability: "Weekends, monthly events",
    preferredStartDate: "2026-01-20",
    preferredEndDate: "2026-03-30",
    helpCategory: "Environmental Awareness",
    status: "completed",
    submittedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    sourceForm: "Projects Dashboard – Offer Help",
    notes: "Outstanding campaign leader. 3 lakes covered.",
    certificateEligible: true,
  },
];

const DEMO_NOTIFICATIONS: AppNotification[] = [
  { id: "notif_001", message: "New volunteer application received for Ignite Education Program (Bhumi NGO)", submissionId: "demo_001", read: false, createdAt: DEMO_SUBMISSIONS[0].submittedAt },
  { id: "notif_002", message: "New water support offer received for Clean Water Supply Initiative (Tankers Foundation)", submissionId: "demo_002", read: true, createdAt: DEMO_SUBMISSIONS[1].submittedAt },
  { id: "notif_003", message: "New collaboration request submitted for Environmental Awareness Programs", submissionId: "demo_003", read: true, createdAt: DEMO_SUBMISSIONS[2].submittedAt },
  { id: "notif_004", message: "Teaching support offer received for Rural Learning Centers (Panchayat NGO)", submissionId: "demo_004", read: false, createdAt: DEMO_SUBMISSIONS[3].submittedAt },
  { id: "notif_005", message: "New food drive partnership offer from Madurai Youth Club for Otrumai NGO", submissionId: "demo_005", read: false, createdAt: DEMO_SUBMISSIONS[4].submittedAt },
];

const DEMO_CERTS: SubmissionCertificate[] = [
  {
    certId: "SDGS-DEMO1-CERT",
    submissionId: "demo_cert_001",
    volunteerName: "Kavya Suresh",
    projectName: "Ignite Education Program",
    ngoName: "Bhumi NGO",
    startDate: "2026-01-15",
    endDate: "2026-04-10",
    issueDate: "10 April 2026",
  },
  {
    certId: "SDGS-DEMO2-CERT",
    submissionId: "demo_cert_002",
    volunteerName: "Arjun Rajan",
    projectName: "Rural Learning Centers",
    ngoName: "Panchayat Learning Center NGO",
    startDate: "2026-02-01",
    endDate: "2026-04-01",
    issueDate: "7 April 2026",
  },
  {
    certId: "SDGS-DEMO3-CERT",
    submissionId: "demo_cert_003",
    volunteerName: "Divya Menon",
    projectName: "Blue Zone – Water Body Restoration",
    ngoName: "Thuvakkam NGO",
    startDate: "2026-01-20",
    endDate: "2026-03-30",
    issueDate: "31 March 2026",
  },
];

function seedIfEmpty(): void {
  if (!localStorage.getItem(SUBMISSIONS_KEY)) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(DEMO_SUBMISSIONS));
  }
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(DEMO_NOTIFICATIONS));
  }
  if (!localStorage.getItem(SUBMISSION_CERTS_KEY)) {
    localStorage.setItem(SUBMISSION_CERTS_KEY, JSON.stringify(DEMO_CERTS));
  }
}

export function getSubmissions(): HelpSubmission[] {
  seedIfEmpty();
  try { return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || "[]"); } catch { return []; }
}

export function getSubmissionsByUser(userId: number): HelpSubmission[] {
  return getSubmissions().filter(s => s.userId === userId);
}

export function saveSubmission(sub: HelpSubmission): void {
  seedIfEmpty();
  const subs = getSubmissions();
  const existing = subs.findIndex(s => s.id === sub.id);
  if (existing >= 0) { subs[existing] = sub; } else { subs.unshift(sub); }
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
}

export function updateSubmissionStatus(id: string, status: SubmissionStatus, notes?: string): SubmissionCertificate | undefined {
  const subs = getSubmissions();
  const idx = subs.findIndex(s => s.id === id);
  if (idx < 0) return;
  subs[idx].status = status;
  if (notes !== undefined) subs[idx].notes = notes;
  if (status === "completed") subs[idx].completedAt = new Date().toISOString();
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));

  if (status === "completed" && isCertificateEligible(subs[idx])) {
    const existing = getCertificateForSubmission(id);
    if (!existing) return generateCertificateFromSubmission(id);
    return existing;
  }
}

export function isCertificateEligible(sub: HelpSubmission): boolean {
  return (
    sub.certificateEligible &&
    !!sub.applicantName &&
    !!sub.projectName &&
    !!sub.ngoName &&
    !!sub.preferredStartDate &&
    !!sub.preferredEndDate
  );
}

export function generateCertificateFromSubmission(submissionId: string): SubmissionCertificate {
  const sub = getSubmissions().find(s => s.id === submissionId);
  if (!sub) throw new Error("Submission not found");
  const cert: SubmissionCertificate = {
    certId: `SDGS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    submissionId,
    volunteerName: sub.applicantName,
    projectName: sub.projectName,
    ngoName: sub.ngoName,
    startDate: sub.preferredStartDate,
    endDate: sub.preferredEndDate,
    issueDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    userId: sub.userId,
  };
  const certs: SubmissionCertificate[] = JSON.parse(localStorage.getItem(SUBMISSION_CERTS_KEY) || "[]");
  certs.push(cert);
  localStorage.setItem(SUBMISSION_CERTS_KEY, JSON.stringify(certs));
  return cert;
}

export function getCertificateForSubmission(submissionId: string): SubmissionCertificate | undefined {
  seedIfEmpty();
  try {
    const certs: SubmissionCertificate[] = JSON.parse(localStorage.getItem(SUBMISSION_CERTS_KEY) || "[]");
    return certs.find(c => c.submissionId === submissionId);
  } catch { return undefined; }
}

export function getCertificateByCertId(certId: string): SubmissionCertificate | undefined {
  seedIfEmpty();
  try {
    const certs: SubmissionCertificate[] = JSON.parse(localStorage.getItem(SUBMISSION_CERTS_KEY) || "[]");
    return certs.find(c => c.certId === certId);
  } catch { return undefined; }
}

export function addSubmissionFromVolunteer(
  app: { id: string; ngoId: string; ngoName: string; projectName: string; fullName: string; email: string; phone: string; startDate: string; endDate: string; availability: string; skills: string; reason: string; appliedAt: string },
  userId?: number
): void {
  const sub: HelpSubmission = {
    id: `sub_${app.id}`,
    submissionType: "volunteer",
    projectId: app.ngoId,
    projectName: app.projectName,
    ngoId: app.ngoId,
    ngoName: app.ngoName,
    applicantName: app.fullName,
    applicantEmail: app.email,
    applicantPhone: app.phone,
    message: app.reason,
    skillsOffered: app.skills,
    availability: app.availability,
    preferredStartDate: app.startDate,
    preferredEndDate: app.endDate,
    helpCategory: "Volunteering",
    status: "new",
    submittedAt: app.appliedAt,
    sourceForm: "NGO Directory – Volunteer Form",
    notes: "",
    certificateEligible: true,
    volunteerApplicationId: app.id,
    organizationName: "",
    userId,
  };
  saveSubmission(sub);
  addNotification(`New volunteer application received for ${app.projectName} (${app.ngoName})`, sub.id);
}

export function addSubmissionFromProjectHelp(data: {
  projectId: string; projectName: string; ngoName: string; helpType: string;
  name: string; email: string; phone: string; message: string;
  specialty: string; availability: string; startDate: string; endDate: string;
}, userId?: number): void {
  const certEligibleTypes = ["Volunteers", "Technical", "Mentorship"];
  const isEligible = certEligibleTypes.includes(data.helpType);
  const submissionType: SubmissionType =
    data.helpType === "Volunteers" ? "volunteer" :
    data.helpType === "Technical" ? "offer_help" :
    data.helpType === "Mentorship" ? "offer_help" :
    data.helpType === "Marketing" ? "awareness" :
    data.helpType === "Legal" ? "offer_help" : "other";

  const sub: HelpSubmission = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    submissionType,
    projectId: data.projectId,
    projectName: data.projectName,
    ngoId: data.projectId,
    ngoName: data.ngoName || data.projectName,
    applicantName: data.name,
    applicantEmail: data.email,
    applicantPhone: data.phone,
    message: data.message,
    skillsOffered: data.specialty,
    availability: data.availability,
    preferredStartDate: data.startDate,
    preferredEndDate: data.endDate,
    helpCategory: data.helpType,
    status: "new",
    submittedAt: new Date().toISOString(),
    sourceForm: "Projects Dashboard – Help Form",
    notes: "",
    certificateEligible: isEligible,
    organizationName: "",
    userId,
  };
  saveSubmission(sub);
  addNotification(`New ${data.helpType} offer received for ${data.projectName}`, sub.id);
}

export function generateSubmissionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getNotifications(): AppNotification[] {
  seedIfEmpty();
  try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]"); } catch { return []; }
}

export function addNotification(message: string, submissionId: string): void {
  seedIfEmpty();
  const notifs = getNotifications();
  notifs.unshift({ id: `notif_${Date.now()}`, message, submissionId, read: false, createdAt: new Date().toISOString() });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs.slice(0, 50)));
}

export function markNotificationRead(id: string): void {
  const notifs = getNotifications();
  const idx = notifs.findIndex(n => n.id === id);
  if (idx >= 0) { notifs[idx].read = true; localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs)); }
}

export function markAllNotificationsRead(): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(getNotifications().map(n => ({ ...n, read: true }))));
}

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  volunteer: "Volunteer Application",
  offer_help: "Offer Help",
  collaboration: "Collaboration Request",
  donation: "Donation / Funding",
  teaching: "Teaching Support",
  medical: "Medical Support",
  food_drive: "Food Drive Support",
  water_support: "Water Support",
  awareness: "Awareness Campaign",
  other: "Other",
};

export const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  reviewed: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  contacted: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  completed: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};
