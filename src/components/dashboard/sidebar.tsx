"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Sparkles,
  LayoutGrid,
  Bell,
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Calendar,
  BarChart3,
  HelpCircle,
  Settings,
  ChevronDown,
  Check,
  Plus,
  User,
  FileText,
  Users,
  Image,
  Files,
  MessageSquare,
} from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconColor: "text-primary" },
  { title: "Insight AI", href: "/dashboard/ai", icon: Sparkles, iconColor: "text-violet-500" },
  { title: "Posts", href: "/dashboard/posts", icon: FileText, iconColor: "text-blue-500" },
  { title: "Calendar", href: "/dashboard/calendar", icon: Calendar, iconColor: "text-orange-500" },
  { title: "Categories", href: "/dashboard/categories", icon: LayoutGrid, iconColor: "text-emerald-500" },
  { title: "Authors", href: "/dashboard/authors", icon: Users, iconColor: "text-cyan-500" },
  { title: "Media", href: "/dashboard/media", icon: Image, iconColor: "text-amber-500" },
  { title: "Messages", href: "/dashboard/messages", icon: MessageSquare, iconColor: "text-rose-500" },
  { title: "Pages", href: "/dashboard/pages", icon: Files, iconColor: "text-indigo-500" },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, iconColor: "text-muted-foreground" },
];

export function DashboardSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="!border-r-0" {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center justify-between w-full">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none w-full justify-start group-data-[collapsible=icon]:justify-center">
              <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <span className="text-sm font-bold">I</span>
              </div>
              <span className="font-semibold text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
                Insight
              </span>
              <ChevronDown className="size-3 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
                Workspaces
              </DropdownMenuLabel>
              <DropdownMenuItem>
                <div className="size-5 rounded bg-primary/20 mr-2 flex items-center justify-center text-xs font-bold text-primary">
                  I+
                </div>
                Insight
                <Check className="size-4 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="size-5 rounded bg-blue-500/20 mr-2 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                  M
                </div>
                Marketing Team
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="size-5 rounded bg-emerald-500/20 mr-2 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  D
                </div>
                Design Studio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="size-4 mr-2" />
                Create Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

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
