import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full min-w-0">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center border-b px-3 sm:px-4">
            <SidebarTrigger />
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
