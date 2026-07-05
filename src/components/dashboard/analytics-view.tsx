"use client";

import { GeolocationSection } from "@/components/analytics/geolocation-section";
import { StatsCards } from "@/components/analytics/stats-cards";
import { TrafficChart } from "@/components/analytics/traffic-chart";
import { DeviceChart } from "@/components/analytics/device-chart";
import { ReferrersChart } from "@/components/analytics/referrers-chart";
import { BrowsersChart } from "@/components/analytics/browsers-chart";
import { OsChart } from "@/components/analytics/os-chart";

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      {/* Title & Stats Cards */}
      <StatsCards />

      {/* Geolocation Map */}
      <GeolocationSection />

      {/* Primary Traffic Line Chart */}
      <TrafficChart />

      {/* Demographics & Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeviceChart />
        <ReferrersChart />
        <BrowsersChart />
        <OsChart />
      </div>
    </div>
  );
}
