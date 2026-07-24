"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Clock,
  Terminal,
  Edit,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Square,
  RotateCcw,
  Trash2,
  Tag,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Pill, PillIndicator, PillIcon } from "@/components/kibo-ui/pill";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";

export interface ProgressLog {
  message: string;
  step: string;
  timestamp: string;
}

export interface PipelineJob {
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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AiPipelineTableProps {
  jobs: PipelineJob[];
  pagination: PaginationMeta;
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onOpenTriggerModal: () => void;
  onStopJob: (jobId: string) => void;
  onRestartJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  onClearAllHistory: () => void;
}

export function AiPipelineTable({
  jobs,
  pagination,
  isLoading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  onLimitChange,
  onOpenTriggerModal,
  onStopJob,
  onRestartJob,
  onDeleteJob,
  onClearAllHistory,
}: AiPipelineTableProps) {
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteSingleJobId, setDeleteSingleJobId] = useState<string | null>(null);

  const toggleLogs = (jobId: string) => {
    setExpandedLogs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  function CategoryBadge({ category }: { category: string }) {
    return (
      <Pill className="font-bold uppercase tracking-tighter text-[10px] bg-muted/50 text-foreground border-transparent">
        <PillIcon icon={Tag} />
        {category}
      </Pill>
    );
  }

  const getStatusBadge = (status: PipelineJob["status"]) => {
    switch (status) {
      case "queued":
        return (
          <Pill variant="outline" className="text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 font-semibold text-[11px]">
            <PillIndicator variant="warning" pulse /> Queued
          </Pill>
        );
      case "generating_outline":
      case "writing_content":
      case "generating_seo":
      case "processing":
        return (
          <Pill variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold text-[11px]">
            <PillIndicator variant="info" pulse /> Processing
          </Pill>
        );
      case "completed":
        return (
          <Pill variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold text-[11px]">
            <PillIndicator variant="success" pulse /> Completed
          </Pill>
        );
      case "failed":
        return (
          <Pill variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold text-[11px]">
            <PillIndicator variant="error" /> Failed
          </Pill>
        );
      default:
        return (
          <Pill variant="outline" className="text-[11px]">
            <PillIndicator variant="info" /> Pending
          </Pill>
        );
    }
  };

  const getProgressColor = (status: PipelineJob["status"], progress: number) => {
    if (status === "failed") return "bg-rose-500 shadow-sm shadow-rose-500/50";
    if (status === "completed" || progress >= 90) return "bg-emerald-500 shadow-sm shadow-emerald-500/50";
    if (progress <= 35) return "bg-amber-500 shadow-sm shadow-amber-500/50";
    return "bg-blue-500 shadow-sm shadow-blue-500/50";
  };

  const getProgressTextColor = (status: PipelineJob["status"], progress: number) => {
    if (status === "failed") return "text-rose-600 dark:text-rose-400";
    if (status === "completed" || progress >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (progress <= 35) return "text-amber-600 dark:text-amber-400";
    return "text-blue-600 dark:text-blue-400";
  };

  const startEntry = (pagination.page - 1) * pagination.limit + 1;
  const endEntry = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search topic, category or job ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-muted/20 border-border/60"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-9 text-xs w-[140px] bg-muted/20 border-border/60">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            className="h-9 text-xs gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium"
            title="Clear all AI pipeline execution history"
          >
            <Trash2 className="size-3.5" />
            Clear History
          </Button>

          <Button size="sm" onClick={onOpenTriggerModal} className="h-9 text-xs gap-1.5 shadow-sm font-medium">
            <Sparkles className="size-3.5" />
            Queue Post
          </Button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent text-muted-foreground bg-muted/30 border-border/60">
              <TableHead className="h-10 w-[50px] text-xs uppercase tracking-wider font-semibold">#</TableHead>
              <TableHead className="h-10 text-xs uppercase tracking-wider font-semibold min-w-[220px]">ARTICLE & CATEGORY</TableHead>
              <TableHead className="h-10 text-xs uppercase tracking-wider font-semibold w-[130px]">STATUS</TableHead>
              <TableHead className="h-10 text-xs uppercase tracking-wider font-semibold min-w-[200px]">PIPELINE PROGRESS</TableHead>
              <TableHead className="h-10 text-xs uppercase tracking-wider font-semibold w-[160px]">CREATED DATE</TableHead>
              <TableHead className="h-10 text-xs uppercase tracking-wider font-semibold text-center w-[160px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: pagination.limit || 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell className="py-4">
                    <div className="h-4 w-4 bg-muted/60 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 bg-muted/60 animate-pulse rounded-lg shrink-0" />
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="h-4 w-48 bg-muted/60 animate-pulse rounded" />
                        <div className="h-3 w-28 bg-muted/40 animate-pulse rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="h-6 w-20 bg-muted/60 animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-full bg-muted/40 animate-pulse rounded" />
                      <div className="h-2 w-full bg-muted/60 animate-pulse rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="h-4 w-24 bg-muted/60 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="h-8 w-24 bg-muted/60 animate-pulse rounded mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <Sparkles className="size-8 text-muted-foreground/40" />
                    <span className="font-semibold text-foreground">No AI pipeline jobs found</span>
                    <p className="text-[11px] text-muted-foreground">
                      Try resetting your search filter or queue a new AI blog post generation job.
                    </p>
                    <Button size="sm" onClick={onOpenTriggerModal} className="mt-2 h-8 text-xs gap-1.5">
                      <Sparkles className="size-3.5" />
                      Queue AI Post
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job, idx) => {
                const isLogsOpen = !!expandedLogs[job.jobId];
                const getPostId = () => {
                  if (!job.postId) return null;
                  return typeof job.postId === "object" ? job.postId._id : job.postId;
                };
                const linkedPostId = getPostId();
                const indexNumber = (pagination.page - 1) * pagination.limit + idx + 1;

                return (
                  <FragmentKeyWrapper key={job.jobId}>
                    <TableRow className="border-border/50 hover:bg-muted/30 transition-colors">
                      {/* Pagination-Aware Index Number */}
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {indexNumber}
                      </TableCell>

                      {/* Topic Title, Job ID & Category */}
                      <TableCell>
                        <div className="flex items-center gap-3 py-1">
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/60 flex items-center justify-center text-muted-foreground/60 shadow-xs">
                            <FileText className="size-4 text-purple-500/80" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground truncate max-w-[240px]" title={job.topic}>
                              {job.topic}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                                {job.jobId}
                              </span>
                              <CategoryBadge category={job.category || "General"} />
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>{getStatusBadge(job.status)}</TableCell>

                      {/* Progress Bar & Current Step */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5 py-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[180px] flex items-center gap-1">
                              <Clock className="size-3 text-primary shrink-0" />
                              {job.currentStep}
                            </span>
                            <span className={cn("font-bold text-xs tabular-nums transition-colors duration-300", getProgressTextColor(job.status, job.progress))}>
                              {job.progress}%
                            </span>
                          </div>
                          <Progress
                            value={job.progress}
                            className="h-1.5 bg-muted/60"
                            indicatorClassName={getProgressColor(job.status, job.progress)}
                          />
                        </div>
                      </TableCell>

                      {/* Created Timestamp */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {job.createdAt ? format(new Date(job.createdAt), "MMM dd, yyyy HH:mm") : "-"}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleLogs(job.jobId)}
                            title="Toggle Execution Logs"
                          >
                            <Terminal className="size-3.5" />
                            <span className="text-[11px]">Logs ({job.logs?.length || 0})</span>
                            {isLogsOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </Button>

                          {/* Stop Processing Button for active jobs */}
                          {(job.status === "queued" ||
                            job.status === "processing" ||
                            job.status === "generating_outline" ||
                            job.status === "writing_content" ||
                            job.status === "generating_seo") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs gap-1 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-medium"
                                onClick={() => onStopJob(job.jobId)}
                                title="Stop / Cancel Job Processing"
                              >
                                <Square className="size-3 fill-rose-500/30" />
                                Stop
                              </Button>
                            )}

                          {/* Restart / Retry Button for finished or failed jobs */}
                          {(job.status === "completed" || job.status === "failed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs gap-1 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10 font-medium"
                              onClick={() => onRestartJob(job.jobId)}
                              title="Restart AI Generation Pipeline"
                            >
                              <RotateCcw className="size-3" />
                              Restart
                            </Button>
                          )}

                          {/* Edit Draft Button */}
                          {job.status === "completed" && linkedPostId && (
                            <Link href={`/dashboard/posts/edit/${linkedPostId}`}>
                              <Button size="sm" variant="outline" className="h-8 px-2 text-xs gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shadow-sm font-medium">
                                <Edit className="size-3" />
                                Edit Draft
                              </Button>
                            </Link>
                          )}

                          {/* Delete Job Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => setDeleteSingleJobId(job.jobId)}
                            title="Delete Job History Record"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Execution Logs Row */}
                    {isLogsOpen && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/40">
                        <TableCell colSpan={6} className="p-3">
                          <div className="rounded-lg bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 p-3.5 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto shadow-sm border border-emerald-500/20 dark:border-emerald-900/40">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-sans border-b border-emerald-500/20 dark:border-emerald-900/40 pb-1.5 mb-2 flex items-center justify-between font-semibold">
                              <span>Terminal Logs & Execution History ({job.jobId})</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Status: {job.status}</span>
                            </div>
                            {job.logs && job.logs.length > 0 ? (
                              job.logs.map((log, lIdx) => (
                                <div key={lIdx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="text-emerald-600/70 dark:text-muted-foreground shrink-0 text-[10px]">
                                    [{log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss") : "--:--:--"}]
                                  </span>
                                  <span className={cn(
                                    log.step === "failed" ? "text-rose-600 dark:text-rose-400 font-bold" :
                                      log.step === "completed" ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-emerald-600 dark:text-emerald-400"
                                  )}>
                                    {log.message}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-emerald-600/70 dark:text-muted-foreground text-xs italic">No execution logs recorded yet.</div>
                            )}
                            {job.error && (
                              <div className="mt-2 pt-1.5 border-t border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                                ⚠ Error: {job.error}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </FragmentKeyWrapper>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Backend Pagination Footer Controls (matches Trending Feed Table style) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border/60">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {pagination.total === 0
                ? "0 AI pipeline jobs"
                : `Showing ${startEntry} to ${endEntry} of ${pagination.total} AI pipeline jobs`}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Rows per page</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(val) => onLimitChange(Number(val))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(1)}
              disabled={pagination.page <= 1}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-sm tabular-nums font-medium">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal for Single Job */}
      <DeleteConfirmModal
        isOpen={!!deleteSingleJobId}
        onClose={() => setDeleteSingleJobId(null)}
        onConfirm={() => {
          if (deleteSingleJobId) {
            onDeleteJob(deleteSingleJobId);
            setDeleteSingleJobId(null);
          }
        }}
        title="Delete Pipeline Job"
        description="Are you sure you want to permanently delete this AI pipeline job record from history?"
        confirmText="Delete"
        requireHold={true}
      />

      {/* Delete Confirmation Modal for Clear All History */}
      <DeleteConfirmModal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          onClearAllHistory();
          setConfirmClearOpen(false);
        }}
        title="Clear All Pipeline History"
        description="Are you sure you want to delete all AI pipeline execution progress records? This action cannot be undone."
        confirmText="Clear All"
        requireHold={true}
      />
    </div>
  );
}

function FragmentKeyWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
