import { AppLayout } from "@/components/layout/layout";
import { SDG_DATA } from "@/lib/sdgs";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function SDGsPage() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">{t("sdgs.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("sdgs.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {SDG_DATA.map((sdg) => {
          const Icon = sdg.icon;
          return (
            <Card key={sdg.id} className="overflow-hidden hover-elevate transition-all border-0 shadow-md">
              <div className="h-2 w-full" style={{ backgroundColor: sdg.color }} />
              <CardContent className="p-5 flex flex-col items-center text-center h-full gap-3 bg-card hover:bg-muted/10 transition-colors">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white mb-2 shadow-inner"
                  style={{ backgroundColor: sdg.color }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-sm leading-tight text-foreground">
                  <span className="text-xs font-bold opacity-60 block mb-1">{t("sdgs.goal", { id: sdg.id })}</span>
                  {sdg.name}
                </h3>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
}
