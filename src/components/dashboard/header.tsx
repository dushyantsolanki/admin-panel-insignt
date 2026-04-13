"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Folder, Bell, LogOut, ChevronRight } from "@/components/icons";
import React from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;

      // Map segments to readable titles
      const titles: Record<string, string> = {
        dashboard: "Dashboard",
        posts: "Posts",
        new: "New Post",
        categories: "Categories",
        authors: "Authors",
        media: "Media",
        messages: "Messages",
        pages: "Pages",
        settings: "Settings",
      };

      const title = titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      return { title, href, isLast };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-card sticky top-0 z-10 w-full shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />
        <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap overflow-hidden">
          <Folder className="size-4 shrink-0" />
          <div className="flex items-center gap-1.5 overflow-hidden">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-50" />}
                <span className={`text-sm font-medium transition-colors ${crumb.isLast ? "text-foreground font-bold" : "text-muted-foreground/70"}`}>
                  {crumb.title}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground relative">
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-card" />
        </Button>
        <ThemeToggle />
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l ml-1 sm:ml-2">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-semibold leading-none">{user?.name || "User"}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{user?.role || "Admin"}</span>
          </div>
          <Avatar className="size-9 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={user?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.name}`} />
            <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "AD"}</AvatarFallback>
          </Avatar>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="size-9 text-muted-foreground hover:text-destructive transition-colors ml-1 sm:ml-2"
          title="Logout"
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  );
}

