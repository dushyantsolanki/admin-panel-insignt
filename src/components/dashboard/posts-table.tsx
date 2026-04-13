"use client";

import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import NextLink from "next/link";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Eye,
  Tag,
  Trash2,
  MoreVertical,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useDashboardStore } from "@/store/dashboard-store";
import { Pill, PillAvatar, PillIndicator, PillIcon } from "@/components/kibo-ui/pill";
import { format } from "date-fns";
import { gooeyToast } from "goey-toast";

type PostStatus = "draft" | "published" | "scheduled";

interface Post {
  _id: string;
  title: string;
  slug: string;
  image: string;
  status: PostStatus;
  category: { _id: string; name: string };
  author: { _id: string; name: string; avatar?: string };
  views: number;
  isHero: boolean;
  isFeatured: boolean;
  date: string;
  videoUrl: string
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === "published") {
    return (
      <Pill variant="secondary">
        <PillIndicator variant="success" pulse />
        Published
      </Pill>
    );
  }
  if (status === "draft") {
    return (
      <Pill variant="outline" className="text-muted-foreground bg-muted/20 border-transparent">
        <PillIndicator variant="warning" />
        <span className="italic">Draft</span>
      </Pill>
    );
  }
  return (
    <Pill variant="outline" className="text-muted-foreground bg-muted/20 border-transparent">
      <PillIndicator variant="info" />
      Scheduled
    </Pill>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <Pill className="font-bold uppercase tracking-tighter text-[10px] bg-muted/50 text-foreground border-transparent">
      <PillIcon icon={Tag} />
      {category}
    </Pill>
  );
}

export function PostsTable() {
  // State for data
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // State for pagination control
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Global filters from store
  const {
    postsSearchQuery,
    setPostsSearchQuery,
    postStatusFilter,
    setPostStatusFilter,
  } = useDashboardStore();

  const debouncedSearchQuery = useDebounce(postsSearchQuery, 500);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search: debouncedSearchQuery,
        status: postStatusFilter,
        sort: "latest", // Could be dynamic later
      });

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();

      setPosts(data.posts || []);
      setTotalRows(data.pagination?.totalPosts || 0);
      setPageCount(data.pagination?.totalPages || 0);
    } catch (error: any) {
      gooeyToast.error('Failed to load posts', {
        description: error.message || 'Error fetching article list',
      });
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchPosts();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, postStatusFilter]);

  const handleDelete = async (id: string) => {
    gooeyToast.warning('Delete this post?', {
      description: 'Are you sure you want to delete this article? This cannot be undone.',
      duration: 8000,
      action: {
        label: 'Confirm Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete post");

            gooeyToast.success('Post deleted', {
              description: 'The article has been removed successfully.',
            });
            fetchPosts();
          } catch (error: any) {
            gooeyToast.error('Something went wrong', {
              description: error.message || 'Error deleting post',
            });
            console.error("Error deleting post:", error);
          }
        },
      },
    });
  };

  const toggleHomeSetting = async (id: string, setting: "isHero" | "isFeatured", currentValue: boolean) => {
    try {
      const res = await fetch(`/api/posts/home`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [setting]: !currentValue })
      });
      if (!res.ok) throw new Error("Failed to update setting");

      // Update local state to show immediately
      setPosts(prev => prev.map(p => p._id === id ? { ...p, [setting]: !currentValue } : p));

      gooeyToast.success('Setting updated', {
        description: `Successfully toggled ${setting === 'isHero' ? 'Hero' : 'Featured'} status.`,
      });
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Failed to update post setting',
      });
    }
  };

  const columns = useMemo<ColumnDef<Post>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        header: "Article",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : p.videoUrl ? (
                  <video
                    src={p.videoUrl}
                    autoPlay
                    muted
                    lazy-loading='true'
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="size-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground truncate max-w-[200px]" title={p.title}>{p.title}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[200px] italic" title={p.slug}>/{p.slug}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <CategoryBadge category={row.original.category?.name || "Uncategorized"} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "homeSettings",
        header: "Home Settings",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id={`hero-${p._id}`}
                  checked={p.isHero}
                  onCheckedChange={() => toggleHomeSetting(p._id, "isHero", p.isHero)}
                />
                <label htmlFor={`hero-${p._id}`} className="text-[10px] font-medium uppercase text-muted-foreground cursor-pointer">Hero</label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id={`featured-${p._id}`}
                  checked={p.isFeatured}
                  onCheckedChange={() => toggleHomeSetting(p._id, "isFeatured", p.isFeatured)}
                />
                <label htmlFor={`featured-${p._id}`} className="text-[10px] font-medium uppercase text-muted-foreground cursor-pointer">Feat</label>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: "views",
        header: "Performance",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
            <Eye className="size-3.5 text-muted-foreground" />
            {(row.original.views || 0).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "author",
        header: "Author",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <Pill variant="secondary" className="bg-transparent border-transparent px-0 hover:bg-transparent">
              <PillAvatar
                fallback={p.author?.name?.slice(0, 2) || "??"}
                src={p.author?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${p.author?.name}`}
                className="size-8"
              />
              <span className="text-sm font-semibold text-foreground ml-2">{p.author?.name?.replace(/(\w+)\s+(\w).*/, "$1 $2.") || "Unknown"}</span>
            </Pill>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const date = new Date(row.original.date);
          return (
            <span className="text-sm text-foreground/90 font-medium">
              {format(date, "dd MMM yyyy hh:mm a")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-start gap-1">
            <NextLink
              href={`/blog/${row.original.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </NextLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <NextLink href={`/dashboard/posts/edit/${row.original._id}`} className="flex items-center gap-2 cursor-pointer">
                    Edit Post
                  </NextLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                  onClick={() => handleDelete(row.original._id)}
                >
                  <Trash2 className="size-3.5" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    []
  );

  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: posts,
    columns,
    pageCount: pageCount,
    state: {
      pagination,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Tell TanStack Table we're handling pagination on server
  });

  const hasActiveFilters = postStatusFilter !== "all";
  const { pageIndex, pageSize } = pagination;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-semibold text-base flex items-center gap-2">
          Posts List
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full lowercase">
            {totalRows} total
          </span>
          {isLoading && <Loader2 className="size-3 animate-spin text-primary" />}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input
              placeholder="Search posts..."
              value={postsSearchQuery}
              onChange={(e) => {
                setPostsSearchQuery(e.target.value);
                setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page on search
              }}
              className="pl-8 h-9 w-full sm:w-[220px] text-sm bg-muted/30 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/50 font-medium">
                <Filter className="size-4" />
                Filter
                {hasActiveFilters && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-bold px-2 py-1.5 uppercase tracking-widest">Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={postStatusFilter === "all"}
                onCheckedChange={() => {
                  setPostStatusFilter("all");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                All posts
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={postStatusFilter === "published"}
                onCheckedChange={() => {
                  setPostStatusFilter("published");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                Published
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={postStatusFilter === "draft"}
                onCheckedChange={() => {
                  setPostStatusFilter("draft");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                Draft
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={postStatusFilter === "scheduled"}
                onCheckedChange={() => {
                  setPostStatusFilter("scheduled");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                Scheduled
              </DropdownMenuCheckboxItem>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setPostStatusFilter("all");
                      setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }}
                    className="text-primary font-medium"
                  >
                    Clear Filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
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
                      <div className="h-6 w-full bg-muted/50 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-16"
                >
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="size-10 opacity-10" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">No articles found</p>
                      <p className="text-xs">Adjust your search or filters to see results.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className=" group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {totalRows === 0
              ? "0 posts"
              : `Showing ${from} to ${to} of ${totalRows} articles`}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                table.setPageSize(Number(v));
                setPagination(prev => ({ ...prev, pageSize: Number(v), pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="8">8</SelectItem>
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
    </div>
  );
}

