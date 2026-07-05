"use client";

import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import {
  EvilAreaChart,
  Area,
  XAxis,
  YAxis,
  Grid,
  Tooltip,
  Legend,
} from "@/components/evilcharts/charts/area-chart";

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

export function TrafficChart() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTraffic() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        const res = await fetch(`/api/analytics/traffic?${params.toString()}`);
        const json = await res.json();
        if (json.performanceChartData) setChartData(json.performanceChartData);
      } catch (error) {
        console.error("Error fetching traffic:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTraffic();
  }, [date]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b bg-muted/20 gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm sm:text-base">Traffic Overview</h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-muted/50 px-2 py-1 rounded hidden sm:inline-block">
            Views vs Visitors
          </span>
        </div>
        <DateRangePicker date={date} setDate={setDate} />
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
  );
}
