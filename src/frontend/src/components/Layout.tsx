import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquarePlus,
  SendHorizonal,
  Users,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/compose", label: "Compose", icon: MessageSquarePlus },
  { path: "/templates", label: "Templates", icon: FileText },
  { path: "/sent", label: "Sent History", icon: SendHorizonal },
];

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/compose": "Compose Message",
  "/templates": "Templates",
  "/sent": "Sent History",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const pageTitle = breadcrumbMap[pathname] ?? "Mahara";

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MH";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-60 shrink-0 border-r border-sidebar-border"
        style={{ background: "oklch(0.18 0.04 255)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
            Mahara
          </span>
        </div>

        {/* User block */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs font-semibold bg-primary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">
              {profile?.name ?? "User"}
            </p>
            <p className="text-xs" style={{ color: "oklch(0.65 0.03 255)" }}>
              Active
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 py-4 space-y-1"
          aria-label="Main navigation"
        >
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                data-ocid={`nav.${label.toLowerCase().replace(" ", "_")}.link`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            data-ocid="nav.logout.button"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-2 px-6 py-4 bg-white border-b border-border shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="shrink-0 bg-white border-t border-border px-6 py-2.5 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
