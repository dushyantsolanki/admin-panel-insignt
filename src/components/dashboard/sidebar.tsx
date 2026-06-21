"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {

  Sparkles,
  LayoutGrid,

  LayoutDashboard,

  Calendar,

  Settings,

  FileText,
  Users,
  Image,
  Files,
  MessageSquare,
  Mail,
} from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,

  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconColor: "text-primary" },
  // { title: "Insight AI", href: "/dashboard/ai", icon: Sparkles, iconColor: "text-violet-500" },
  { title: "Posts", href: "/dashboard/posts", icon: FileText, iconColor: "text-blue-500" },
  { title: "Calendar", href: "/dashboard/calendar", icon: Calendar, iconColor: "text-orange-500" },
  { title: "Categories", href: "/dashboard/categories", icon: LayoutGrid, iconColor: "text-emerald-500" },
  { title: "Authors", href: "/dashboard/authors", icon: Users, iconColor: "text-cyan-500" },
  { title: "Media", href: "/dashboard/media", icon: Image, iconColor: "text-amber-500" },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare, iconColor: "text-rose-500" },
  { title: "Subscribers", href: "/dashboard/subscribers", icon: Mail, iconColor: "text-purple-500" },
  // { title: "Pages", href: "/dashboard/pages", icon: Files, iconColor: "text-indigo-500" },
  // { title: "Settings", href: "/dashboard/settings", icon: Settings, iconColor: "text-muted-foreground" },
];

export function DashboardSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="!border-r-0" {...props}>
      <div className="px-3 py-4">
        <div className="flex items-center justify-between w-full">

          <div className="flex items-center gap-2 outline-none w-full justify-start group-data-[collapsible=icon]:justify-center">
            <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shrink-0">
              <span className="text-sm font-bold">I</span>
            </div>
            <span className="font-semibold text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
              Insight
            </span>
          </div>
        </div>
      </div>

      <SidebarContent className="px-2 no-scrollbar">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item: any) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
                    className="h-9"
                    tooltip={item.title}
                  >
                    <Link href={item.href || "#"}>
                      <item.icon className={cn("size-4 shrink-0", item.iconColor)} />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3 group-data-[collapsible=icon]:hidden">
        {/* Branding box removed as per previous request */}
      </SidebarFooter>
    </Sidebar>
  );
}
