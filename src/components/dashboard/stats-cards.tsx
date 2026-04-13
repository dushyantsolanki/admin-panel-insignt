"use client";

import { dashboardStats } from "@/mock-data/dashboard";
import { FileText, Eye, Clock, Users } from "@/components/icons";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Total Posts",
    value: dashboardStats.totalPosts.value,
    change: dashboardStats.totalPosts.change,
    icon: FileText,
    color: "blue",
  },
  {
    title: "Monthly Views",
    value: dashboardStats.monthlyViews.value,
    change: dashboardStats.monthlyViews.change,
    icon: Eye,
    color: "emerald",
  },
  {
    title: "Avg. Read Time",
    value: dashboardStats.avgReadTime.value,
    change: dashboardStats.avgReadTime.change,
    icon: Clock,
    color: "amber",
  },
  {
    title: "Total Readers",
    value: dashboardStats.totalReaders.value,
    change: dashboardStats.totalReaders.change,
    icon: Users,
    color: "violet",
  },
];

export function StatsCards() {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">
                <span className="text-emerald-500">+{stat.change}%</span> vs last month
              </p>
            </div>
            <div className={cn(
              "flex size-10 items-center justify-center rounded-lg border shrink-0 transition-transform group-hover:scale-110",
              colorMap[stat.color]
            )}>
              <stat.icon className="size-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
