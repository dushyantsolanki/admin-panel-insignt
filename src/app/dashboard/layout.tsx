import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="bg-sidebar">
      <div className="flex h-screen w-full bg-sidebar">
        <DashboardSidebar />
        <div className="flex-1 h-screen overflow-hidden lg:p-2 w-full">
          <div className="lg:border lg:rounded-xl overflow-hidden flex flex-col h-full w-full bg-background">
            <DashboardHeader />
            <main className="w-full flex-1 overflow-auto bg-background p-2 md:p-2 lg:p-4 no-scrollbar">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
