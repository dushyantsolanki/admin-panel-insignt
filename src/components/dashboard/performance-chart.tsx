"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ChevronUp, ChevronDown } from "@/components/icons";
import {
  EvilBarChart,
  Bar as EvilBar,
  XAxis as BarXAxis,
  YAxis as BarYAxis,
  Grid as BarGrid,
  Tooltip as BarTooltip,
} from "@/components/evilcharts/charts/bar-chart";
import {
  EvilLineChart,
  Line as EvilLine,
  XAxis as LineXAxis,
  YAxis as LineYAxis,
  Grid as LineGrid,
  Tooltip as LineTooltip,
} from "@/components/evilcharts/charts/line-chart";
import {
  EvilAreaChart,
  Area as EvilArea,
  XAxis as AreaXAxis,
  YAxis as AreaYAxis,
  Grid as AreaGrid,
  Tooltip as AreaTooltip,
} from "@/components/evilcharts/charts/area-chart";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
type ChartType = "bar" | "line" | "area";

const chartConfig = {
  views: {
    label: "Views",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function PerformanceChart() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [showGrid, setShowGrid] = useState(true);
  const [smoothCurve, setSmoothCurve] = useState(true);
  const [data, setData] = useState<{ day: string; views: number; visitors: number }[]>([]);
  const [viewsStats, setViewsStats] = useState({ total: "0", change: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const resetToDefault = () => {
    setChartType("bar");
    setDate({ from: subDays(new Date(), 30), to: new Date() });
    setShowGrid(true);
    setSmoothCurve(true);
  };

  useEffect(() => {
    async function fetchChartData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        const res = await fetch(`/api/analytics/traffic?${params.toString()}`);
        const json = await res.json();
        if (json.performanceChartData) {
          setData(json.performanceChartData);
        }
        
        // Fetch stats to get view change percentage
        const statsRes = await fetch(`/api/analytics/stats?${params.toString()}`);
        const statsJson = await statsRes.json();
        if (statsJson.stats) {
          setViewsStats({
            total: statsJson.stats.monthlyViews.value,
            change: statsJson.stats.monthlyViews.change,
          });
        }
      } catch (error) {
        console.error("Error fetching performance chart data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChartData();
  }, [date]);

  const totalViewsThisPeriod = data.reduce((acc, curr) => acc + curr.views, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <h3 className="font-semibold text-sm sm:text-base">Visitor Analytics</h3>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <DateRangePicker date={date} setDate={setDate} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 hover:bg-muted transition-colors">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="sm:hidden p-2">
                <DateRangePicker date={date} setDate={setDate} />
              </div>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm">Chart Type</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setChartType("bar")}>
                    Bar Chart {chartType === "bar" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType("line")}>
                    Line Chart {chartType === "line" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType("area")}>
                    Area Chart {chartType === "area" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showGrid}
                onCheckedChange={(value) => setShowGrid(!!value)}
                className="text-sm"
              >
              Show Grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={smoothCurve}
              onCheckedChange={(value) => setSmoothCurve(!!value)}
              disabled={chartType === "bar"}
              className="text-sm"
            >
              Smooth Curve
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetToDefault} className="text-sm text-destructive focus:text-destructive">
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {isLoading ? "..." : totalViewsThisPeriod.toLocaleString()}
            </span>
            {!isLoading && (
              <div className={cn(
                "flex items-center gap-1 font-medium text-sm",
                viewsStats.change >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {viewsStats.change >= 0 ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                {Math.abs(viewsStats.change)}%
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-muted/50 px-2 py-1 rounded">
            Selected Period
          </div>
        </div>

        <div className="flex-1 w-full h-full min-h-[220px]">
          {chartType === "bar" ? (
            <EvilBarChart
              data={data}
              config={chartConfig}
              className="h-full w-full"
              isLoading={isLoading}
            >
              {showGrid && <BarGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
              <BarXAxis dataKey="day" />
              <BarYAxis />
              <BarTooltip variant="frosted-glass" />
              <EvilBar dataKey="views" variant="gradient" isClickable />
            </EvilBarChart>
          ) : chartType === "area" ? (
            <EvilAreaChart
              data={data}
              config={chartConfig}
              className="h-full w-full"
              isLoading={isLoading}
              curveType={smoothCurve ? "bump" : "linear"}
            >
              {showGrid && <AreaGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
              <AreaXAxis dataKey="day" />
              <AreaYAxis />
              <AreaTooltip variant="frosted-glass" />
              <EvilArea dataKey="views" variant="gradient" strokeVariant="solid" isClickable />
            </EvilAreaChart>
          ) : (
            <EvilLineChart
              data={data}
              config={chartConfig}
              className="h-full w-full"
              isLoading={isLoading}
              curveType={smoothCurve ? "bump" : "linear"}
            >
              {showGrid && <LineGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
              <LineXAxis dataKey="day" />
              <LineYAxis />
              <LineTooltip variant="frosted-glass" />
              <EvilLine dataKey="views" strokeVariant="solid" isClickable />
            </EvilLineChart>
          )}
        </div>
      </div>
    </div>
  );
}
