"use client";

import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Laptop } from "lucide-react";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { type ChartConfig } from "@/components/evilcharts/ui/chart";
import {
  EvilRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RadarTooltip,
} from "@/components/evilcharts/charts/radar-chart";

const osChartConfig = {
  value: {
    label: "Views",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
} satisfies ChartConfig;

export function OsChart() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [os, setOs] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        const res = await fetch(`/api/analytics/demographics/os?${params.toString()}`);
        const json = await res.json();
        if (json.os) setOs(json.os);
      } catch (error) {
        console.error("Error fetching OS:", error);
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
          <Laptop className="size-4 text-muted-foreground" />
          Operating Systems
        </h3>
        <DateRangePicker date={date} setDate={setDate} />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-center min-h-[250px]">
        {isLoading || os.length > 0 ? (
          <div className="h-[250px] w-full flex items-center justify-center">
            <EvilRadarChart
              data={os as any}
              config={osChartConfig}
              className="h-[250px] w-full"
              isLoading={isLoading}

            >
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis dataKey="name" tick={true} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={true} axisLine={true} />
              <Radar
                dataKey="value"
                fillOpacity={0.2}
                variant='filled'
              />
              <RadarTooltip variant="frosted-glass" />
            </EvilRadarChart>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center my-12">No OS data recorded</p>
        )}
      </div>
    </div>
  );
}
