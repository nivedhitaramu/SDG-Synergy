import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Certificate } from "@/lib/volunteer-store";
import { ArrowLeft, Printer } from "lucide-react";

function getCertificateByCertId(certId: string): Certificate | undefined {
  try {
    const certs: Certificate[] = JSON.parse(localStorage.getItem("sdg_certificates") || "[]");
    return certs.find(c => c.certId === certId);
  } catch {
    return undefined;
  }
}

export default function CertificatePage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/certificate/:certId");
  const [, setLocation] = useLocation();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (params?.certId) {
      const found = getCertificateByCertId(params.certId);
      if (found) {
        setCert(found);
      } else {
        setNotFound(true);
      }
    }
  }, [params?.certId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-8">
        <p className="text-xl font-bold text-foreground">Certificate not found</p>
        <Button onClick={() => setLocation("/volunteer-hub")}>← Back to Volunteer Hub</Button>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 dark:from-green-950/30 dark:via-background dark:to-amber-950/20 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Print controls — hidden when printing */}
        <div className="flex gap-3 mb-6 print:hidden">
          <Button variant="outline" onClick={() => setLocation("/volunteer-hub")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {t("certificate.back")}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> {t("certificate.print")}
          </Button>
        </div>

        {/* Certificate */}
        <div id="certificate-content"
          className="bg-white dark:bg-card border-4 border-double border-amber-400 dark:border-amber-600 rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-transparent rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-green-400/20 to-transparent rounded-br-3xl" />

          {/* Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">🌿</span>
              <span className="font-display font-black text-3xl text-green-700 dark:text-green-400 tracking-tight">SDG Synergy</span>
            </div>

            <div>
              <h1 className="text-4xl font-display font-black text-gray-800 dark:text-white tracking-tight">
                {t("certificate.title")}
              </h1>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="h-0.5 w-16 bg-amber-400" />
                <span className="text-2xl">🏆</span>
                <div className="h-0.5 w-16 bg-amber-400" />
              </div>
            </div>

            <div className="py-4">
              <p className="text-gray-500 dark:text-gray-400 text-lg">{t("certificate.presentedTo")}</p>
              <p className="text-5xl font-display font-black text-gray-900 dark:text-white mt-2 leading-tight">
                {cert.volunteerName}
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-gray-700 dark:text-gray-300 leading-relaxed text-lg max-w-lg mx-auto">
              <p>
                {t("certificate.body")}{" "}
                <strong className="text-gray-900 dark:text-white">{cert.projectName}</strong>{" "}
                {t("certificate.under")}{" "}
                <strong className="text-gray-900 dark:text-white">{cert.ngoName}</strong>{" "}
                {t("certificate.from")}{" "}
                <strong className="text-gray-900 dark:text-white">{cert.startDate}</strong>{" "}
                {t("certificate.to")}{" "}
                <strong className="text-gray-900 dark:text-white">{cert.endDate}</strong>.
              </p>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
                {t("certificate.body2")}
              </p>
            </div>

            {/* Footer details */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="border-t-2 border-amber-300 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{t("certificate.issueDate")}</p>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{cert.issueDate}</p>
              </div>
              <div className="border-t-2 border-amber-300 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{t("certificate.certId")}</p>
                <p className="font-mono font-bold text-gray-800 dark:text-white">{cert.certId}</p>
              </div>
            </div>

            <div className="border-t border-amber-200 dark:border-amber-800 mt-6 pt-6 flex items-center justify-center gap-2">
              <span className="text-xl">🌿</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t("certificate.issuedBy")}</p>
              <span className="text-xl">🌿</span>
            </div>

            {/* SDG Wheel decoration */}
            <div className="flex justify-center gap-1.5 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(n => (
                <div key={n} className="w-2 h-2 rounded-full opacity-60"
                  style={{ backgroundColor: `hsl(${(n - 1) * 21}, 70%, 50%)` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          #certificate-content { box-shadow: none !important; border-width: 3px !important; }
        }
      `}</style>
    </div>
  );
}
