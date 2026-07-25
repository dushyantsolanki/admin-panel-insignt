"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  EvilAreaChart,
  Area as EvilArea,
  XAxis as AreaXAxis,
  YAxis as AreaYAxis,
  Grid as AreaGrid,
  Tooltip as AreaTooltip,
} from "@/components/evilcharts/charts/area-chart";
import {
  EvilLineChart,
  Line as EvilLine,
  XAxis as LineXAxis,
  YAxis as LineYAxis,
  Grid as LineGrid,
  Tooltip as LineTooltip,
} from "@/components/evilcharts/charts/line-chart";
import {
  EvilBarChart,
  Bar as EvilBar,
  XAxis as BarXAxis,
  YAxis as BarYAxis,
  Grid as BarGrid,
  Tooltip as BarTooltip,
} from "@/components/evilcharts/charts/bar-chart";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import {
  Flame,
  Globe,
  Plus,
  ArrowUpRight,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Zap,
} from "lucide-react";
import { Pill, PillIcon } from "@/components/kibo-ui/pill";
import { TrendingUp } from "../icons";

type ChartType = "area" | "line" | "bar";

function formatTrafficNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${num}`;
}

const chartConfig = {
  traffic: {
    label: "Search Traffic",
    colors: {
      light: ["#22c55e"],
      dark: ["#4ade80"],
    },
  },
} satisfies ChartConfig;

interface TrendingTopic {
  id: string;
  title: string;
  formattedTraffic: string;
  trafficCount: number;
  category: string;
  pubDate: string;
  articles: { title: string; source: string; url: string }[];
  relatedQueries: string[];
  geo: string;
  growth?: string;
}

interface TrendTrafficModalProps {
  topic: TrendingTopic | null;
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (topic: TrendingTopic) => void;
}

export function TrendTrafficModal({
  topic,
  isOpen,
  onClose,
  onCreatePost,
}: TrendTrafficModalProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [chartData, setChartData] = useState<{ day: string; traffic: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!topic || !isOpen) return;

    async function fetchTrafficData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          keyword: topic!.title,
          geo: topic!.geo || "US",
          period: "today 1-m",
        });

        const res = await fetch(`/api/trending/traffic?${params.toString()}`);
        const json = await res.json();
        if (json.chartData) {
          setChartData(json.chartData);
        }
      } catch (err) {
        console.error("Failed fetching traffic timeline data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrafficData();
  }, [topic, isOpen]);

  if (!topic) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[700px]">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle className="text-base font-medium sm:text-lg">
            {topic.title}
            <p className="text-muted-foreground text-xs font-normal mt-0.5">
              View search traffic volume and interest timeline for this trending topic.
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          {/* Stats Highlight Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 sm:p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Zap className="size-3 text-muted-foreground shrink-0" />
                Peak Interest
              </span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-foreground mt-1">
                {chartData.length > 0 ? Math.max(...chartData.map((d) => d.traffic)) : 100}%
              </span>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 sm:p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="size-3 text-muted-foreground shrink-0" />
                Traffic Volume
              </span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-foreground mt-1">
                {formatTrafficNumber(topic.trafficCount)}+
              </span>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 sm:p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-center gap-1">
                <Globe className="size-3 text-muted-foreground shrink-0" />
                Region
              </span>
              <span className="text-xs sm:text-sm font-semibold text-foreground mt-1 uppercase tracking-wide">
                {topic.geo || "US"}
              </span>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Pill variant="secondary">
              <PillIcon icon={Flame} className="text-amber-500 fill-amber-500/20" />
              <span className="font-semibold text-xs tabular-nums">{formatTrafficNumber(topic.trafficCount)}+</span>
            </Pill>
            {topic.growth && (
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingUp className="size-3" />
                {topic.growth}
              </span>
            )}
            <span className="text-[10px] font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {topic.category}
            </span>
          </div>

          {/* Chart View Switcher Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" />
              Interest Timeline
            </span>
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50">
              <button
                onClick={() => setChartType("area")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${chartType === "area" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Activity className="size-3" />
                Area
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${chartType === "line" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <LineChartIcon className="size-3" />
                Line
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${chartType === "bar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <BarChart3 className="size-3" />
                Bar
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-[220px] w-full rounded-xl border border-border/50 bg-muted/10 p-3 relative flex items-center justify-center mb-4">
            {chartType === "area" ? (
              <EvilAreaChart data={chartData} config={chartConfig} className="h-full w-full" curveType="natural" isLoading={isLoading}>
                <AreaGrid strokeDasharray="3 3" vertical={false} />
                <AreaXAxis dataKey="day" />
                <AreaYAxis />
                <AreaTooltip variant="frosted-glass" />
                <EvilArea dataKey="traffic" variant="gradient" strokeVariant="solid" />
              </EvilAreaChart>
            ) : chartType === "line" ? (
              <EvilLineChart data={chartData} config={chartConfig} className="h-full w-full" curveType="natural" isLoading={isLoading}>
                <LineGrid strokeDasharray="3 3" vertical={false} />
                <LineXAxis dataKey="day" />
                <LineYAxis />
                <LineTooltip variant="frosted-glass" />
                <EvilLine dataKey="traffic" />
              </EvilLineChart>
            ) : (
              <EvilBarChart data={chartData} config={chartConfig} className="h-full w-full" isLoading={isLoading}>
                <BarGrid strokeDasharray="3 3" vertical={false} />
                <BarXAxis dataKey="day" />
                <BarYAxis />
                <BarTooltip variant="frosted-glass" />
                <EvilBar dataKey="traffic" variant="gradient" />
              </EvilBarChart>
            )}
          </div>

          {/* Related Queries */}
          {topic.relatedQueries.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Related:</span>
              {topic.relatedQueries.slice(0, 6).map((query, i) => (
                <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/40">
                  #{query}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="w-full sm:w-auto gap-1.5"
            onClick={() => {
              onClose();
              onCreatePost(topic);
            }}
          >
            <Plus className="size-3.5" />
            Create Post from Trend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
