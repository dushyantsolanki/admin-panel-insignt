"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Plus,
  ArrowRight,
  RefreshCw,
  Edit,
  Bot,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gooeyToast } from "goey-toast";
import { cn } from "@/lib/utils";
import { AiPipelineTable } from "@/components/dashboard/ai-pipeline-table";

interface ProgressLog {
  message: string;
  step: string;
  timestamp: string;
}

interface PipelineJob {
  _id: string;
  jobId: string;
  topic: string;
  category: string;
  status: "queued" | "processing" | "generating_outline" | "writing_content" | "generating_seo" | "completed" | "failed";
  progress: number;
  currentStep: string;
  logs: ProgressLog[];
  postSlug?: string;
  postId?: { _id: string; title: string; slug: string } | string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AiPipelinePage() {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, failed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Technology");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rabbitOfflineWarning, setRabbitOfflineWarning] = useState<string | null>(null);

  // Poll progress from API every 3 seconds
  const fetchProgress = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status: statusFilter,
      });

      const res = await fetch(`/api/ai-pipeline/progress?${queryParams.toString()}`);
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
        if (data.pagination) setPaginationMeta(data.pagination);
        setStats(data.stats || { active: 0, completed: 0, failed: 0, total: 0 });
      }
    } catch (err) {
      console.error("Failed fetching pipeline progress:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(() => fetchProgress(), 3000);
    return () => clearInterval(interval);
  }, [page, limit, search, statusFilter]);

  const handleTriggerAiJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setIsSubmitting(true);
    setRabbitOfflineWarning(null);
    try {
      const res = await fetch("/api/ai-pipeline/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput.trim(),
          category: categoryInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.offline) {
          setRabbitOfflineWarning(data.error);
          gooeyToast.error("RabbitMQ Service Offline", {
            description: "RabbitMQ container is not running on port 8080.",
          });
        } else {
          throw new Error(data.error || "Failed to trigger AI pipeline job");
        }
        return;
      }

      gooeyToast.success("AI Pipeline Job Queued!", {
        description: `Topic: "${topicInput}" pushed to RabbitMQ queue.`,
      });

      setTopicInput("");
      setDialogOpen(false);
      fetchProgress();
    } catch (err: any) {
      gooeyToast.error("Error triggering AI pipeline", {
        description: err.message || "Failed to push message to queue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopJob = async (jobId: string) => {
    try {
      const res = await fetch("/api/ai-pipeline/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to stop job");
      gooeyToast.success("Job Processing Stopped", {
        description: `Pipeline execution for ${jobId} was stopped.`,
      });
      fetchProgress();
    } catch (err: any) {
      gooeyToast.error("Error stopping job", { description: err.message });
    }
  };

  const handleRestartJob = async (jobId: string) => {
    try {
      const res = await fetch("/api/ai-pipeline/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart", jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restart job");
      gooeyToast.success("Job Re-queued!", {
        description: `Pipeline execution for ${jobId} was restarted.`,
      });
      fetchProgress();
    } catch (err: any) {
      gooeyToast.error("Error restarting job", { description: err.message });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/ai-pipeline/progress?jobId=${jobId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete job");
      gooeyToast.success("Job Record Deleted", {
        description: `Job ${jobId} removed from history.`,
      });
      fetchProgress();
    } catch (err: any) {
      gooeyToast.error("Error deleting job", { description: err.message });
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const res = await fetch("/api/ai-pipeline/progress?clearAll=true", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear history");
      gooeyToast.success("Pipeline History Cleared", {
        description: `All execution progress history records deleted.`,
      });
      setPage(1);
      fetchProgress();
    } catch (err: any) {
      gooeyToast.error("Error clearing history", { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="size-6" />
          AI Blog Generation Pipeline
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Monitor real-time RabbitMQ queue processing, worker status, and automated blog draft creation.
        </p>
      </div>

      {/* Offline RabbitMQ Warning Banner */}
      {rabbitOfflineWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm mb-0.5">RabbitMQ Service Offline</h4>
            <p>{rabbitOfflineWarning}</p>
            <p className="mt-1 font-mono text-[11px] opacity-80">
              Run in terminal: <code className="bg-background px-1.5 py-0.5 rounded border border-amber-500/30">docker run -d --name rabbitmq -p 8080:5672 -p 15672:15672 rabbitmq:3-management</code>
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Jobs</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">{stats.active}</span>
            {stats.active > 0 && <span className="size-2 rounded-full bg-blue-500 animate-pulse" />}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Drafts</span>
          <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">{stats.completed}</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Failed</span>
          <span className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-2">{stats.failed}</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total AI Pipeline Jobs</span>
          <span className="text-2xl font-bold tabular-nums text-foreground mt-2">{stats.total}</span>
        </div>
      </div>

      {/* Job Progress Data Table */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          Pipeline Execution Jobs
        </h3>

        <AiPipelineTable
          jobs={jobs}
          pagination={paginationMeta}
          isLoading={isLoading}
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          onPageChange={setPage}
          onLimitChange={(val) => {
            setLimit(val);
            setPage(1);
          }}
          onOpenTriggerModal={() => setDialogOpen(true)}
          onStopJob={handleStopJob}
          onRestartJob={handleRestartJob}
          onDeleteJob={handleDeleteJob}
          onClearAllHistory={handleClearAllHistory}
        />
      </div>

      {/* Queue Trigger Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[500px]">
          <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base font-medium sm:text-lg">
              Queue AI Blog Generation
              <p className="text-muted-foreground text-xs font-normal mt-0.5">
                Enter a topic keyword to push a message into the RabbitMQ queue.
              </p>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTriggerAiJob} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="topic" className="text-xs font-semibold text-foreground">
                  Target Topic / Keyword
                </Label>
                <Input
                  id="topic"
                  placeholder="E.g. Future of Artificial Intelligence in Web Development"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  className="h-9 text-sm bg-muted/20 border-border/60"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="category" className="text-xs font-semibold text-foreground">
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="E.g. Technology, Sports, Business"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="h-9 text-sm bg-muted/20 border-border/60"
                />
              </div>
            </div>

            <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto h-9 text-xs">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-9 text-xs font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Pushing to Queue...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Push to RabbitMQ Queue
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
