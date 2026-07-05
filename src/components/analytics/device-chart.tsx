"use client";

import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Monitor } from "lucide-react";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import {
  EvilLineChart,
  Line as EvilLine,
  XAxis as LineXAxis,
  YAxis as LineYAxis,
  Grid as LineGrid,
  Tooltip as LineTooltip,
} from "@/components/evilcharts/charts/line-chart";

const lineChartConfig = {
  value: {
    label: "Views",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
} satisfies ChartConfig;

export function DeviceChart() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [devices, setDevices] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        const res = await fetch(`/api/analytics/demographics/devices?${params.toString()}`);
        const json = await res.json();
        if (json.devices) setDevices(json.devices);
      } catch (error) {
        console.error("Error fetching devices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [date]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b bg-muted/20 gap-3">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <Monitor className="size-4 text-muted-foreground" />
          Device Types
        </h3>
        <DateRangePicker date={date} setDate={setDate} />
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
  );
}
