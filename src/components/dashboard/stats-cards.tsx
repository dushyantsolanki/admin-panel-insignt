"use client";

import { useState, useEffect } from "react";
import { FileText, Eye, Clock, Users } from "@/components/icons";
import { cn } from "@/lib/utils";

interface StatItem {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

export function StatsCards() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.stats) {
          setStats([
            {
              title: "Total Posts",
              value: json.stats.totalPosts.value,
              change: json.stats.totalPosts.change,
              icon: FileText,
              color: "blue",
            },
            {
              title: "Monthly Views",
              value: json.stats.monthlyViews.value,
              change: json.stats.monthlyViews.change,
              icon: Eye,
              color: "emerald",
            },
            {
              title: "Avg. Read Time",
              value: json.stats.avgReadTime.value,
              change: json.stats.avgReadTime.change,
              icon: Clock,
              color: "amber",
            },
            {
              title: "Total Readers",
              value: json.stats.totalReaders.value,
              change: json.stats.totalReaders.change,
              icon: Users,
              color: "violet",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-4 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-7 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
              <div className="size-10 bg-muted rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
                <span className={cn(stat.change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {stat.change >= 0 ? `+${stat.change}` : stat.change}%
                </span> vs last month
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
