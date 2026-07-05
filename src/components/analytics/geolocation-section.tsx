"use client";

import React, { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip } from "@/components/ui/map";
import { Pill, PillIndicator } from "@/components/kibo-ui/pill";

interface GeoData {
  country: string;
  totalCount: number;
  states: { state: string; city: string; count: number; latitude?: number; longitude?: number }[];
}


export function GeolocationSection() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGeoData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (date?.from) params.set("startDate", date.from.toISOString());
      if (date?.to) params.set("endDate", date.to.toISOString());

      const res = await fetch(`/api/analytics/geolocation/aggregate?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setGeoData(json.data);
      }
    } catch (error) {
      console.error("Error fetching geo data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchGeoData();
  }, [fetchGeoData]);

  const topCountries = geoData.slice(0, 10);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 border-b bg-muted/20 gap-4">
        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
          <MapPin className="size-5" />
          Geolocation
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchGeoData}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <DateRangePicker date={date} setDate={setDate} />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden min-h-[500px]">
        {/* Map Area */}
        <div className="lg:col-span-2 relative bg-muted/50 border-r">
          <Map
            viewport={{
              center: [0, 20],
              zoom: 1.5
            }}
          >
            <MapControls />

            {topCountries.map((countryData, idx) => {
              let label = countryData.country;
              let coords: [number, number] | undefined;

              // Try to find the city or state first, otherwise use country
              if (countryData.states && countryData.states.length > 0) {
                const topState = countryData.states[0];
                label = topState.city !== "Unknown" ? topState.city : (topState.state !== "Unknown" ? topState.state : countryData.country);

                // Use API coordinates if available
                if (topState.latitude && topState.longitude) {
                  coords = [topState.longitude, topState.latitude];
                }
              }

              if (!coords) return null;
              return (
                <MapMarker key={`marker-${idx}`} longitude={coords[0]} latitude={coords[1]}>
                  <MarkerContent className="">
                    <Pill variant="secondary" className="bg-transparent">
                      <PillIndicator variant="success" pulse />
                    </Pill>
                  </MarkerContent>

                </MapMarker>
              );
            })}
          </Map>
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Data List Area */}
        <div className="flex flex-col bg-background overflow-hidden max-h-[500px]">
          <div className="bg-muted/30 p-3 border-b">
            <h3 className="font-semibold text-sm">Top Regions</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {topCountries.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground text-center p-8">
                No geolocation data found for this date range.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {topCountries.map((country, idx) => (
                  <div key={idx} className="p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-foreground">{country.country}</span>
                      <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
                        {country.totalCount} views
                      </span>
                    </div>
                    <div className="space-y-2">
                      {country.states.slice(0, 5).map((s, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                          <span className="truncate mr-2 font-medium">
                            {s.city !== "Unknown" ? s.city : s.state}
                          </span>
                          <span className="font-mono text-foreground/70">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
