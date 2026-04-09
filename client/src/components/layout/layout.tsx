import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { ChatWidget } from "@/components/shared/chat-widget";

const style = {
  "--sidebar-width": "18rem",
  "--sidebar-width-icon": "4rem",
} as React.CSSProperties;

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center px-4 border-b border-border/50 bg-background/95 backdrop-blur z-10 sticky top-0">
            <SidebarTrigger className="hover-elevate" />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ChatWidget />
    </SidebarProvider>
  );
}
