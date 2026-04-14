import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  UserCircle,
  LogOut,
  Leaf,
  Rss,
  Sparkles,
  Sun,
  Moon,
  CalendarDays,
  Building2,
  HandHeart,
  ShieldCheck,
  Languages,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ta", label: "த", name: "தமிழ்" },
  { code: "hi", label: "हि", name: "हिंदी" },
];

function Globe(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const mainItems = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.feed"), url: "/feed", icon: Rss },
    { title: t("nav.matches"), url: "/matches", icon: Sparkles },
    { title: t("nav.projects"), url: "/projects", icon: Briefcase },
    { title: t("nav.events"), url: "/events", icon: CalendarDays },
    { title: t("nav.ngos"), url: "/ngos", icon: Building2 },
    { title: t("nav.volunteerDashboard"), url: "/volunteer-hub", icon: HandHeart },
    { title: t("nav.submissions"), url: "/submissions", icon: Inbox },
    { title: t("nav.profile"), url: "/profile", icon: UserCircle },
    { title: t("nav.sdgs"), url: "/sdgs", icon: Globe },
  ];

  function changeLanguage(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem("sdg_lang", code);
  }

  const currentLang = i18n.language?.split("-")[0] || "en";

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">{t("appName")}</span>
        </div>

        {/* Language Switcher */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl p-1">
            <Languages className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                title={lang.name}
                data-testid={`button-lang-${lang.code}`}
                className={`flex-1 text-xs font-bold py-1 rounded-lg transition-all ${
                  currentLang === lang.code
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground uppercase text-xs tracking-wider">
            {t("common.filter")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="hover-elevate active-elevate-2 font-medium"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin link */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/admin"}
                  className="hover-elevate active-elevate-2 font-medium text-muted-foreground"
                >
                  <Link href="/admin">
                    <ShieldCheck className="w-5 h-5" />
                    <span>{t("nav.admin")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="hover-elevate active-elevate-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
              className="text-destructive hover:bg-destructive/10 hover-elevate active-elevate-2 font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t("nav.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
