"use client";

import { useState, useEffect } from "react";
import { Eye, Users, Clock, FileText, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface StatItem {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
};

export function StatsCards() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        const res = await fetch(`/api/analytics/stats?${params.toString()}`);
        const json = await res.json();

        if (json.stats) {
          setStats([
            {
              title: "Page Views",
              value: json.stats.monthlyViews.value,
              change: json.stats.monthlyViews.change,
              icon: Eye,
              color: "blue",
            },
            {
              title: "Unique Visitors",
              value: json.stats.totalReaders.value,
              change: json.stats.totalReaders.change,
              icon: Users,
              color: "emerald",
            },
            {
              title: "Avg. Session Time",
              value: json.stats.avgReadTime.value,
              change: json.stats.avgReadTime.change,
              icon: Clock,
              color: "amber",
            },
            {
              title: "Total Articles",
              value: json.stats.totalPosts.value,
              change: json.stats.totalPosts.change,
              icon: FileText,
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
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-primary animate-pulse" />
            Detailed Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deep dive into your traffic metrics, user demographics, referrers, and content performance.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DateRangePicker date={date} setDate={setDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-7 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
                <div className="size-10 bg-muted rounded-lg shrink-0" />
              </div>
            </div>
          ))
          : stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <span className={cn("inline-flex items-center font-bold", stat.change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {stat.change >= 0 ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      {Math.abs(stat.change)}%
                    </span>
                    vs last period
                  </p>
                </div>
                <div className={cn("flex size-10 items-center justify-center rounded-lg border shrink-0", colorMap[stat.color])}>
                  <stat.icon className="size-5" />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
