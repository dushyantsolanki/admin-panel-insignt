"use client";

import React from "react";
import { TrendingTable } from "@/components/dashboard/trending-table";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, RefreshCw } from "lucide-react";

export default function TrendingPage() {
  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Google Trending Topics
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <TrendingUp className="size-3" />
              Live Insights
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover trending Google searches, explore related news context, and quickly convert high-volume topics into blog posts.
          </p>
        </div>
      </div>

      <TrendingTable />
    </div>
  );
}
