"use client";

import { Button } from "@/components/ui/button";
import { Download, Plus } from "@/components/icons";
import { welcomeSummary } from "@/mock-data/dashboard";
import { StatsCards } from "./stats-cards";
import { RecentComments } from "./recent-comments";
import { PerformanceChart } from "./performance-chart";
import { PostsTable } from "./posts-table";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";


function WelcomeSection() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Welcome Back, {user?.name?.split(' ')?.map((name) => name[0].toUpperCase())}!  👋

        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening with your blog today.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border">
          <Download className="size-4" />
          Export Report
        </Button>
        <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          onClick={() => router.push('/dashboard/posts')}>
          <Plus className="size-4" />
          Write Post
        </Button>
      </div>
    </div>
  );
}

export function DashboardContent() {
  return (
    <div className="mx-auto w-full space-y-6 pb-12">
      <WelcomeSection />

      <StatsCards />

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 items-stretch">
        <div className="lg:col-span-1">
          <PerformanceChart />
        </div>
        <div className="lg:col-span-1">
          <RecentComments />
        </div>
      </div>

      <div className="space-y-4">
        <PostsTable />
      </div>
    </div>
  );
}
