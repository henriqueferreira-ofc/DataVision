import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Upload, BarChart3, FileText, Settings, LogOut } from "lucide-react";

export function DashboardSidebar() {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { title: t.dashboard.home, url: "/dashboard", icon: Home },
    { title: t.dashboard.upload, url: "/dashboard/upload", icon: Upload },
    { title: t.dashboard.analyses, url: "/dashboard/analyses", icon: BarChart3 },
    { title: t.dashboard.reports, url: "/dashboard/reports", icon: FileText },
    { title: t.dashboard.settings, url: "/dashboard/settings", icon: Settings },
  ];

  const isExpanded = items.some((i) => location.pathname === i.url);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex h-16 items-center gap-2.5 px-4 border-b border-sidebar-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">Datavision</span>}
        </div>

        <SidebarGroup open={isExpanded} onOpenChange={() => {}}>
          <SidebarGroupLabel>{!collapsed ? "Menu" : ""}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              {t.nav.logout}
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
