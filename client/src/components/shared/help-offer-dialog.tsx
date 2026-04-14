import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wrench, DollarSign, GraduationCap, UserCheck, Megaphone, Scale,
  HandHeart, CreditCard, Lock, CheckCircle2, ChevronRight, IndianRupee, Award
} from "lucide-react";
import { useJoinProject } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addSubmissionFromProjectHelp } from "@/lib/help-submissions";
import type { Project } from "@shared/schema";

const HELP_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string; description: string; certEligible?: boolean }> = {
  Technical: {
    icon: Wrench, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
    label: "Offer Technical Help", description: "Share your technical expertise with this project"
  },
  Funding: {
    icon: IndianRupee, color: "text-green-600", bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    label: "Fund This Project", description: "Contribute financially to help this project succeed"
  },
  Mentorship: {
    icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
    label: "Offer Mentorship", description: "Guide and support this project with your experience"
  },
  Volunteers: {
    icon: UserCheck, color: "text-orange-600", bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
    label: "Volunteer for This Project", description: "Offer your time and effort to make an impact",
    certEligible: true,
  },
  Marketing: {
    icon: Megaphone, color: "text-pink-600", bg: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800",
    label: "Offer Marketing Support", description: "Help amplify this project's reach and visibility"
  },
  Legal: {
    icon: Scale, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800",
    label: "Provide Legal Guidance", description: "Offer your legal expertise to support this initiative"
  },
};

// ─── Mock Payment Gateway ────────────────────────────────────────────────────
function FundingForm({ project, onSuccess }: { project: Project; onSuccess: () => void }) {
  const [step, setStep] = useState<"amount" | "card" | "done">("amount");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [processing, setProcessing] = useState(false);

  const PRESETS = ["500", "1000", "2500", "5000", "10000"];
  const finalAmount = amount === "custom" ? customAmount : amount;

  const handleCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    setCard(c => ({ ...c, number: digits.replace(/(.{4})/g, "$1 ").trim() }));
  };
  const handleExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setCard(c => ({ ...c, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits }));
  };

  const handlePay = () => { setProcessing(true); setTimeout(() => { setProcessing(false); setStep("done"); }, 2000); };

  if (step === "done") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Payment Submitted!</h3>
        <p className="text-muted-foreground text-sm">
          Your contribution of <strong>₹{Number(finalAmount).toLocaleString("en-IN")}</strong> to <strong>{project.title}</strong> has been recorded.
        </p>
        <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">🔒 This is a simulated transaction — no real funds were transferred.</div>
        <Button onClick={onSuccess} className="w-full">Done</Button>
      </div>
    );
  }

  if (step === "card") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-secondary text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-6 -translate-x-6" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div><p className="text-xs opacity-70 uppercase tracking-wider">SDG Synergy Pay</p><p className="text-lg font-bold mt-0.5">₹{Number(finalAmount).toLocaleString("en-IN")}</p></div>
            <CreditCard className="w-8 h-8 opacity-80" />
          </div>
          <p className="font-mono text-base tracking-widest relative z-10">{card.number || "•••• •••• •••• ••••"}</p>
          <div className="flex justify-between items-end mt-3 relative z-10">
            <div><p className="text-xs opacity-60">Card Holder</p><p className="text-sm font-medium">{card.name || "YOUR NAME"}</p></div>
            <div><p className="text-xs opacity-60">Expires</p><p className="text-sm font-medium">{card.expiry || "MM/YY"}</p></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Card Number</Label>
            <div className="relative"><Input data-testid="input-card-number" placeholder="1234 5678 9012 3456" value={card.number} onChange={e => handleCardNumber(e.target.value)} className="font-mono pl-10" /><CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name on Card</Label>
            <Input data-testid="input-card-name" placeholder="As on your card" value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiry</Label><Input data-testid="input-card-expiry" placeholder="MM/YY" value={card.expiry} onChange={e => handleExpiry(e.target.value)} maxLength={5} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CVV</Label><Input data-testid="input-card-cvv" placeholder="•••" type="password" maxLength={3} value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) }))} /></div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" /><span>This is a demo — no real payment will be processed.</span>
        </div>
        <Button data-testid="button-pay" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handlePay} disabled={processing || !card.number || !card.name || !card.expiry || !card.cvv}>
          {processing ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</span> : <>Pay ₹{Number(finalAmount).toLocaleString("en-IN")} <ChevronRight className="w-4 h-4 ml-1" /></>}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold mb-3 block">Choose Amount (₹)</Label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESETS.map(p => (
            <button key={p} data-testid={`amount-preset-${p}`} type="button" onClick={() => setAmount(p)}
              className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${amount === p ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}>
              ₹{Number(p).toLocaleString("en-IN")}
            </button>
          ))}
          <button type="button" onClick={() => setAmount("custom")}
            className={`py-2.5 rounded-lg border text-sm font-semibold transition-all col-span-1 ${amount === "custom" ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}>
            Custom
          </button>
        </div>
        {amount === "custom" && <div className="relative"><span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span><Input data-testid="input-custom-amount" placeholder="Enter amount" className="pl-7" type="number" min="1" value={customAmount} onChange={e => setCustomAmount(e.target.value)} /></div>}
      </div>
      <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Project</span><span className="font-medium text-foreground text-right max-w-[60%] line-clamp-1">{project.title}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Amount</span><span className="font-bold text-foreground">{finalAmount ? `₹${Number(finalAmount).toLocaleString("en-IN")}` : "—"}</span></div>
      </div>
      <Button data-testid="button-proceed-payment" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={!finalAmount || Number(finalAmount) < 1} onClick={() => setStep("card")}>
        Proceed to Payment <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ─── Generic Help Forms ──────────────────────────────────────────────────────
function GenericHelpForm({ type, project, onSuccess }: { type: string; project: Project; onSuccess: () => void }) {
  const { user } = useAuth();
  const joinProject = useJoinProject();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const isVolunteer = type === "Volunteers";
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    message: "",
    availability: "",
    specialty: "",
    commitment: "",
    platforms: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = () => {
    addSubmissionFromProjectHelp({
      projectId: String(project.id),
      projectName: project.title,
      ngoName: project.title,
      helpType: type,
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
      specialty: form.specialty || form.platforms,
      availability: form.availability || form.commitment,
      startDate: form.startDate,
      endDate: form.endDate,
    }, user?.id);

    joinProject.mutate(project.id, {
      onSuccess: () => setSubmitted(true),
      onError: () => setSubmitted(true),
    });
  };

  if (submitted) {
    const certEligible = HELP_CONFIG[type]?.certEligible;
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Offer Submitted!</h3>
        <p className="text-muted-foreground text-sm">
          You've offered <strong>{type}</strong> help to <strong>{project.title}</strong>. The project owner will review your submission in the Help Submissions dashboard.
        </p>
        {certEligible && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-amber-800 dark:text-amber-300">
              <strong>Certificate Eligible!</strong> Once marked completed, you can download a certificate from your Volunteer Hub.
            </p>
          </div>
        )}
        <Button onClick={onSuccess} className="w-full">Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Name *</Label>
        <Input data-testid="input-help-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name or org name" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
          <Input type="email" data-testid="input-help-email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</Label>
          <Input data-testid="input-help-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
        </div>
      </div>

      {(type === "Technical" || type === "Legal") && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {type === "Technical" ? "Area of Technical Expertise" : "Legal Specialisation"}
          </Label>
          <Input data-testid="input-help-specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder={type === "Technical" ? "E.g. Solar systems, IoT, Web Dev" : "E.g. Environmental law, NGO compliance"} />
        </div>
      )}

      {type === "Mentorship" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What Can You Mentor On?</Label>
          <Input data-testid="input-help-specialty" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="E.g. Strategy, fundraising, community engagement" />
        </div>
      )}

      {type === "Marketing" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platforms / Channels</Label>
          <Input data-testid="input-help-platforms" value={form.platforms} onChange={e => setForm(f => ({ ...f, platforms: e.target.value }))} placeholder="E.g. Instagram, LinkedIn, Press, SEO" />
        </div>
      )}

      {type === "Volunteers" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Commitment</Label>
          <Select value={form.commitment} onValueChange={v => setForm(f => ({ ...f, commitment: v }))}>
            <SelectTrigger data-testid="select-commitment"><SelectValue placeholder="Select availability…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekends">Weekends only</SelectItem>
              <SelectItem value="parttime">Part-time (10–20 hrs/week)</SelectItem>
              <SelectItem value="fulltime">Full-time</SelectItem>
              <SelectItem value="onsite">On-site deployment</SelectItem>
              <SelectItem value="flexible">Flexible / on-demand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isVolunteer && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</Label>
            <Input type="date" data-testid="input-help-start" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</Label>
            <Input type="date" data-testid="input-help-end" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Availability</Label>
        <Input data-testid="input-help-availability" value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} placeholder="E.g. Starting May, 2 weeks, ongoing" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message to Project Owner</Label>
        <Textarea data-testid="input-help-message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell them why you want to help and what you bring…" rows={3} />
      </div>

      {HELP_CONFIG[type]?.certEligible && (
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
          <Award className="w-3.5 h-3.5 shrink-0" />
          <span><strong>Certificate Eligible</strong> — you can earn a completion certificate for this contribution.</span>
        </div>
      )}

      <Button data-testid="button-submit-help" className="w-full" onClick={handleSubmit} disabled={joinProject.isPending || !form.name}>
        {joinProject.isPending ? "Submitting…" : `Submit ${type} Offer`}
      </Button>
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────
type Props = { open: boolean; onClose: () => void; helpType: string; project: Project; };

export function HelpOfferDialog({ open, onClose, helpType, project }: Props) {
  const config = HELP_CONFIG[helpType];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold w-fit border mb-2 ${config.bg} ${config.color}`}>
            <Icon className="w-4 h-4" /> {helpType}
            {config.certEligible && <span className="ml-1 flex items-center gap-1 text-amber-600"><Award className="w-3 h-3" /> Certificate Eligible</span>}
          </div>
          <DialogTitle className="font-display text-xl leading-tight">{config.label}</DialogTitle>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <div className="text-xs text-muted-foreground mt-1 font-medium line-clamp-1">Project: <span className="text-foreground">{project.title}</span></div>
        </DialogHeader>
        <div className="mt-2">
          {helpType === "Funding" ? <FundingForm project={project} onSuccess={onClose} /> : <GenericHelpForm type={helpType} project={project} onSuccess={onClose} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
