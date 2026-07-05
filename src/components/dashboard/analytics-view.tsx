"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Users,
  Clock,
  ArrowUpRight,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  ChevronUp,
  ChevronDown,
  Sparkles,
  FileText,
  Compass,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import {
  EvilAreaChart,
  Area,
  XAxis,
  YAxis,
  Grid,
  Tooltip,
  Legend,
} from "@/components/evilcharts/charts/area-chart";
import {
  EvilRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RadarTooltip,
} from "@/components/evilcharts/charts/radar-chart";
import {
  EvilLineChart,
  Line as EvilLine,
  XAxis as LineXAxis,
  YAxis as LineYAxis,
  Grid as LineGrid,
  Tooltip as LineTooltip,
  Legend as LineLegend,
} from "@/components/evilcharts/charts/line-chart";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import { Pill } from "@/components/kibo-ui/pill";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeolocationSection } from "@/components/analytics/geolocation-section";

type Period = "7d" | "30d";

interface StatItem {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

interface PopularPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  avgTime: string;
  completionRate: number;
  category: string;
  author: string;
}

interface BreakdownItem {
  name: string;
  value: number;
}

const chartConfig = {
  views: {
    label: "Page Views",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  visitors: {
    label: "Unique Visitors",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

const osChartConfig = {
  value: {
    label: "Views",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
} satisfies ChartConfig;

const lineChartConfig = {
  value: {
    label: "Views",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function AnalyticsView() {
  const [period, setPeriod] = useState<Period>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [isPopularLoading, setIsPopularLoading] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [devices, setDevices] = useState<BreakdownItem[]>([]);
  const [referrers, setReferrers] = useState<BreakdownItem[]>([]);
  const [browsers, setBrowsers] = useState<BreakdownItem[]>([]);
  const [os, setOs] = useState<BreakdownItem[]>([]);

  // Popular posts table state
  const [popularPage, setPopularPage] = useState(1);
  const [popularLimit, setPopularLimit] = useState(5);
  const [popularSearch, setPopularSearch] = useState("");
  const [popularTotal, setPopularTotal] = useState(0);
  const [popularPages, setPopularPages] = useState(1);
  const debouncedPopularSearch = useDebounce(popularSearch, 500);

  useEffect(() => {
    async function fetchMainAnalytics() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics?period=${period}`);
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

        if (json.performanceChartData) setChartData(json.performanceChartData);
        if (json.devices) setDevices(json.devices);
        if (json.referrers) setReferrers(json.referrers);
        if (json.browsers) setBrowsers(json.browsers);
        if (json.os) setOs(json.os);
      } catch (error) {
        console.error("Error fetching analytics details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMainAnalytics();
  }, [period]);

  useEffect(() => {
    async function fetchPopularPosts() {
      setIsPopularLoading(true);
      try {
        const params = new URLSearchParams({
          period,
          popularPage: popularPage.toString(),
          popularLimit: popularLimit.toString(),
          popularSearch: debouncedPopularSearch,
        });
        const res = await fetch(`/api/analytics?${params.toString()}`);
        const json = await res.json();
        if (json.popularPosts) {
          setPopularPosts(json.popularPosts.posts);
          setPopularTotal(json.popularPosts.pagination.total);
          setPopularPages(json.popularPosts.pagination.pages);
          if (json.popularPosts.pagination.pages > 0 && popularPage > json.popularPosts.pagination.pages) {
            setPopularPage(json.popularPosts.pagination.pages);
          }
        }
      } catch (error) {
        console.error("Error fetching popular posts:", error);
      } finally {
        setIsPopularLoading(false);
      }
    }
    fetchPopularPosts();
  }, [period, popularPage, popularLimit, debouncedPopularSearch]);

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
  };

  const getDeviceIcon = (deviceName: string) => {
    switch (deviceName.toLowerCase()) {
      case "mobile":
        return <Smartphone className="size-4 text-emerald-500" />;
      case "tablet":
        return <Tablet className="size-4 text-amber-500" />;
      default:
        return <Laptop className="size-4 text-blue-500" />;
    }
  };



  return (
    <div className="space-y-6">
      {/* Title & Filter bar */}
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
        <div className="flex items-center gap-1.5 bg-muted/30 border p-1.5 rounded-lg shrink-0">
          <Button
            type="button"
            variant={period === "7d" ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 px-3 font-semibold", period === "7d" && "bg-background shadow-xs border")}
            onClick={() => setPeriod("7d")}
          >
            Last 7 Days
          </Button>
          <Button
            type="button"
            variant={period === "30d" ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 px-3 font-semibold", period === "30d" && "bg-background shadow-xs border")}
            onClick={() => setPeriod("30d")}
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
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
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 shadow-sm"
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
                    vs last month
                  </p>
                </div>
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-lg border shrink-0",
                  colorMap[stat.color]
                )}>
                  <stat.icon className="size-5" />
                </div>
              </div>
            </div>
          ))}
      </div>

      <GeolocationSection />
      {/* Primary Traffic Line Chart */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">

        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <h3 className="font-semibold text-sm sm:text-base">Traffic Overview</h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-muted/50 px-2 py-1 rounded">
            Views vs Visitors
          </span>
        </div>
        <div className="p-4 md:p-6">

          <div className="h-[350px] w-full">
            <EvilAreaChart
              data={chartData}
              config={chartConfig}
              className="h-full w-full"
              xDataKey="day"
              isLoading={isLoading}
              curveType="bump"

            >
              <Grid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Legend isClickable />
              <Tooltip variant="frosted-glass" />
              <Area dataKey="views" variant="gradient" strokeVariant="solid" isClickable />
              <Area dataKey="visitors" variant="gradient" strokeVariant="solid" isClickable />
            </EvilAreaChart>
          </div>
        </div>
      </div>

      {/* Grid of Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device breakdown */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Monitor className="size-4 text-muted-foreground" />
              Device Types
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center min-h-[250px]">
            {isLoading || devices.length > 0 ? (
              <div className="h-[250px] w-full flex items-center justify-center">
                <EvilLineChart
                  data={devices as any}
                  config={lineChartConfig}
                  className="h-full w-full"
                  isLoading={isLoading}
                  curveType="bump"
                >
                  <LineGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <LineXAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <LineYAxis tick={{ fontSize: 11 }} />
                  <LineTooltip variant="frosted-glass" />
                  <EvilLine dataKey="value" strokeVariant="solid" isClickable />
                </EvilLineChart>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center my-12">No device data available</p>
            )}
          </div>
        </div>

        {/* Channels/Referrers breakdown */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              Top Referrers
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center min-h-[250px]">
            {isLoading || referrers.length > 0 ? (
              <div className="h-[250px] w-full flex items-center justify-center">
                <EvilLineChart
                  data={referrers as any}
                  config={lineChartConfig}
                  className="h-full w-full"
                  isLoading={isLoading}
                  curveType="bump"
                >
                  <LineGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <LineXAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <LineYAxis tick={{ fontSize: 11 }} />
                  <LineTooltip variant="frosted-glass" />
                  <EvilLine dataKey="value" strokeVariant="solid" isClickable />
                </EvilLineChart>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center my-12">No referral data recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Browser and OS Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Browser breakdown */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Compass className="size-4 text-muted-foreground" />
              Top Browsers
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center min-h-[250px]">
            {isLoading || browsers.length > 0 ? (
              <div className="h-[250px] w-full flex items-center justify-center">
                <EvilLineChart
                  data={browsers as any}
                  config={lineChartConfig}
                  className="h-full w-full"
                  isLoading={isLoading}
                  curveType="bump"
                >
                  <LineGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <LineXAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <LineYAxis tick={{ fontSize: 11 }} />
                  <LineTooltip variant="frosted-glass" />
                  <EvilLine dataKey="value" strokeVariant="solid" isClickable />
                </EvilLineChart>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center my-12">No browser data recorded</p>
            )}
          </div>
        </div>

        {/* OS breakdown */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Monitor className="size-4 text-muted-foreground" />
              Operating Systems
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center min-h-[250px]">
            {isLoading || os.length > 0 ? (
              <div className="h-[250px] w-full flex items-center justify-center">
                <EvilRadarChart
                  data={os as unknown as Record<string, unknown>[]}
                  config={osChartConfig}
                  className="h-full w-full"
                  isLoading={isLoading}
                >
                  <PolarGrid gridType="circle" />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Radar dataKey="value" variant="filled" isGlowing />
                  <RadarTooltip variant="frosted-glass" />
                </EvilRadarChart>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center my-12">No OS data recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Popular Posts breakdown */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b bg-muted/20">
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Top Performing Pages & Articles
            {isPopularLoading && <Loader2 className="size-3 animate-spin text-primary" />}
          </h3>
          <div className="relative group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input
              placeholder="Search pages..."
              value={popularSearch}
              onChange={(e) => {
                setPopularSearch(e.target.value);
                setPopularPage(1);
              }}
              className="pl-8 h-8 w-full sm:w-[200px] text-xs bg-background border border-border/60 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          {isPopularLoading && popularPosts.length === 0 ? (
            <div className="p-4 space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded w-full" />
              ))}
            </div>
          ) : popularPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center my-12">No content traffic data recorded</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-muted/5 text-muted-foreground font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="p-3 pl-4">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Views</th>
                  <th className="p-3 text-right">Avg. Session</th>
                  <th className="p-3 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {popularPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-foreground max-w-[200px] sm:max-w-[300px] truncate">
                      {post.title}
                    </td>
                    <td className="p-3">
                      <Pill variant="secondary" className="font-semibold">
                        {post.category}
                      </Pill>
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-foreground">
                      {post.views.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-muted-foreground">
                      {post.avgTime}
                    </td>
                    <td className="p-3 text-right pr-4">
                      <NextLink
                        href={`https://modern-blog-nine-virid.vercel.app/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View <ArrowUpRight className="size-3" />
                      </NextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination controls */}
        {!isLoading && popularPosts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-muted/5">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {popularTotal === 0
                  ? "0 pages"
                  : `Showing ${(popularPage - 1) * popularLimit + 1} to ${Math.min(popularPage * popularLimit, popularTotal)} of ${popularTotal} pages`}
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Rows per page</span>
                <Select
                  value={String(popularLimit)}
                  onValueChange={(v) => {
                    setPopularLimit(Number(v));
                    setPopularPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[60px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setPopularPage(1)}
                disabled={popularPage === 1 || isPopularLoading}
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setPopularPage((prev) => Math.max(prev - 1, 1))}
                disabled={popularPage === 1 || isPopularLoading}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="px-2 text-xs font-medium tabular-nums">
                {popularPage} / {popularPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setPopularPage((prev) => Math.min(prev + 1, popularPages))}
                disabled={popularPage >= popularPages || isPopularLoading}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setPopularPage(popularPages)}
                disabled={popularPage >= popularPages || isPopularLoading}
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
