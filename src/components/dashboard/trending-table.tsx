"use client";

import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Loader2,
  TrendingUp,
  Flame,
  Tag,
  Plus,
  Eye,
  Sparkles,
} from "lucide-react";
import { Pill, PillIcon } from "@/components/kibo-ui/pill";
import { gooeyToast } from "goey-toast";
import { TrendTrafficModal } from "@/components/dashboard/trend-traffic-modal";

interface Article {
  title: string;
  source: string;
  url: string;
  snippet?: string;
}

interface TrendingTopic {
  id: string;
  title: string;
  formattedTraffic: string;
  trafficCount: number;
  category: string;
  pubDate: string;
  articles: Article[];
  relatedQueries: string[];
  geo: string;
  growth?: string;
}

function formatTrafficNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${num}`;
}

export function TrendingTable() {
  const router = useRouter();
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // Dynamic Metadata state fetched from APIs
  const [countriesList, setCountriesList] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [selectedGeo, setSelectedGeo] = useState("US");
  const [selectedModalTopic, setSelectedModalTopic] = useState<TrendingTopic | null>(null);

  // Server-side Pagination State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // 1. Fetch dynamic countries from API endpoint
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const countriesRes = await fetch("/api/trending/countries");
        const countriesData = await countriesRes.json();
        setCountriesList(countriesData.countries || []);
      } catch (err) {
        console.error("Failed fetching dynamic metadata APIs:", err);
      }
    };
    fetchMetadata();
  }, []);

  // 2. Fetch Google Trending Topics data with backend pagination
  const fetchTrendingData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search: debouncedSearch,
        geo: selectedGeo,
      });

      const res = await fetch(`/api/trending?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch trending topics");
      const data = await res.json();

      setTrends(data.trends || []);
      setTotalRows(data.pagination?.totalItems || 0);
      setPageCount(data.pagination?.totalPages || 0);
    } catch (error: any) {
      gooeyToast.error("Failed to load trends", {
        description: error.message || "Error fetching Google Trending Topics",
      });
      console.error("Failed to fetch trends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, selectedGeo]);

  const handleCreatePostFromTrend = (topic: TrendingTopic) => {
    gooeyToast.success("Creating post draft", {
      description: `Pre-filling title: "${topic.title}"`,
    });
    const queryParams = new URLSearchParams({
      title: topic.title,
      category: topic.category,
      focusKeyword: topic.relatedQueries[0] || topic.title,
    });
    router.push(`/dashboard/posts/new?${queryParams.toString()}`);
  };

  const handleTriggerAiPipeline = async (topic: TrendingTopic) => {
    try {
      gooeyToast.info("Queueing AI Generation...", {
        description: `Pushing "${topic.title}" to RabbitMQ pipeline...`,
      });

      const res = await fetch("/api/ai-pipeline/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.title,
          category: topic.category,
          keywords: topic.relatedQueries,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.offline) {
          gooeyToast.error("RabbitMQ Service Offline", {
            description: "RabbitMQ container is not running on port 8080.",
          });
        } else {
          throw new Error(json.error || "Failed to trigger AI pipeline");
        }
        return;
      }

      gooeyToast.success("AI Generation Queued!", {
        description: `Track progress on AI Pipeline dashboard.`,
      });
      router.push("/dashboard/ai-pipeline");
    } catch (err: any) {
      gooeyToast.error("Failed to queue AI job", {
        description: err.message || "An error occurred",
      });
    }
  };

  const columns = useMemo<ColumnDef<TrendingTopic>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => {
          const indexNumber = pagination.pageIndex * pagination.pageSize + row.index + 1;
          return (
            <span className="font-mono text-xs text-muted-foreground font-semibold px-1">
              {indexNumber}
            </span>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Trending Topic & Related Keywords",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex flex-col gap-1.5 py-1.5 min-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                  {t.title}
                </span>
                {t.growth && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                    <TrendingUp className="size-3" />
                    {t.growth}
                  </span>
                )}
              </div>

              {/* Related Queries Chips */}
              <div className="flex flex-wrap items-center gap-1">
                {t.relatedQueries.slice(0, 3).map((query, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/40 hover:bg-muted transition-colors"
                  >
                    #{query}
                  </span>
                ))}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "trafficCount",
        header: "Search Volume",
        cell: ({ row }) => {
          const t = row.original;
          const isHighVolume = t.trafficCount >= 500000;
          return (
            <Pill variant={isHighVolume ? "secondary" : "outline"} className="border-border/50">
              <PillIcon icon={Flame} className={isHighVolume ? "text-amber-500 fill-amber-500/20 animate-pulse" : "text-orange-400"} />
              <span className="font-semibold tabular-nums text-xs">
                {formatTrafficNumber(t.trafficCount)}+
              </span>
            </Pill>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat = row.original.category;
          return (
            <Pill className="font-bold uppercase tracking-tighter text-[10px] bg-muted/50 text-foreground border-transparent">
              <PillIcon icon={Tag} />
              {cat}
            </Pill>
          );
        },
      },
      {
        accessorKey: "articles",
        header: "Top News Reference",
        cell: ({ row }) => {
          const article = row.original.articles[0];
          if (!article) return <span className="text-xs text-muted-foreground">No article linked</span>;
          return (
            <div className="flex flex-col gap-0.5 max-w-[220px] w-full min-w-0 py-1">
              <NextLink
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-foreground hover:text-primary underline-offset-2 hover:underline inline-flex items-center gap-1 min-w-0 max-w-full"
                title={article.title}
              >
                <span className="truncate text-ellipsis overflow-hidden whitespace-nowrap min-w-0 flex-1">
                  {article.title}
                </span>
                <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
              </NextLink>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
                Source: {article.source}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/60 hover:bg-muted/60 text-xs font-medium"
                onClick={() => setSelectedModalTopic(t)}
                title="View Traffic & Interest Chart"
              >
                <Eye className="size-3.5 text-muted-foreground" />
                View Traffic
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-medium"
                onClick={() => handleTriggerAiPipeline(t)}
                title="Queue AI Auto-Generation Job"
              >
                <Sparkles className="size-3.5" />
                AI Generate
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
                onClick={() => handleCreatePostFromTrend(t)}
              >
                <Plus className="size-3.5" />
                Create Post
              </Button>
            </div>
          );
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  const table = useReactTable({
    data: trends,
    columns,
    pageCount: pageCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const { pageIndex, pageSize } = pagination;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Top Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <TrendingUp className="size-4 text-red-500" />
            <span>Google Trends Feed</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-normal">
            {totalRows} topics
          </span>
          {isLoading && <Loader2 className="size-3.5 animate-spin text-primary ml-1" />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input
              placeholder="Search trend titles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-8 h-9 w-full sm:w-[200px] text-sm bg-muted/40 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>

          {/* Geo/Country Selector (Fetched via /api/trending/countries) */}
          <Select
            value={selectedGeo}
            onValueChange={(val) => {
              setSelectedGeo(val);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-xs border-border/50 bg-background">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {countriesList.length > 0 ? (
                countriesList.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="GLOBAL">All</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent text-muted-foreground bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs uppercase tracking-wider font-semibold">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-7 w-full bg-muted/40 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : trends.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-16"
                >
                  <div className="flex flex-col items-center gap-3">
                    <TrendingUp className="size-10 opacity-10" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">No trending topics found</p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting country, category, or search filters.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Server Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {totalRows === 0
              ? "0 trends"
              : `Showing ${from} to ${to} of ${totalRows} trending topics`}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                table.setPageSize(Number(v));
                setPagination((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 text-sm tabular-nums font-medium">
            {pageIndex + 1} / {pageCount || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      <TrendTrafficModal
        topic={selectedModalTopic}
        isOpen={!!selectedModalTopic}
        onClose={() => setSelectedModalTopic(null)}
        onCreatePost={handleCreatePostFromTrend}
      />
    </div>
  );
}
