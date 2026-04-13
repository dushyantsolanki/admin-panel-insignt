"use client";

import { useState } from "react";
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
import { MoreVertical, ChevronUp } from "@/components/icons";
import {
  performanceChartData,
} from "@/mock-data/dashboard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

type ChartType = "bar" | "line" | "area";
type Period = "7d" | "30d";

const chartConfig = {
  value: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
};

export function PerformanceChart() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [period, setPeriod] = useState<Period>("7d");
  const [showGrid, setShowGrid] = useState(true);
  const [smoothCurve, setSmoothCurve] = useState(true);

  const resetToDefault = () => {
    setChartType("bar");
    setPeriod("7d");
    setShowGrid(true);
    setSmoothCurve(true);
  };

  const data = performanceChartData;
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <h3 className="font-semibold text-sm sm:text-base">Visitor Analytics</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 hover:bg-muted transition-colors">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-sm">Time Period</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setPeriod("7d")}>
                  Last 7 days {period === "7d" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriod("30d")}>
                  Last 30 days {period === "30d" && "✓"}
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
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">128.4K</span>
            <div className="flex items-center gap-1 text-emerald-500 font-medium text-sm">
              <ChevronUp className="size-3" />
              5.2%
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-muted/50 px-2 py-1 rounded">
            Overall Score: 86
          </div>
        </div>

        <div className="flex-1 w-full h-full min-h-[220px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip cursor={{ fill: "hsl(var(--muted) / 0.5)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.value === maxVal ? "url(#barGradient)" : "var(--chart-1)"}
                        fillOpacity={entry.value === maxVal ? 1 : 0.15}
                        className="transition-all hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === "area" ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type={smoothCurve ? "monotone" : "linear"}
                    dataKey="value"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type={smoothCurve ? "monotone" : "linear"}
                    dataKey="value"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--card))", stroke: "var(--chart-1)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "var(--chart-1)", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
