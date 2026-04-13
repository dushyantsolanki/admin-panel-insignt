"use client";

import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
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
  Circle,
  LayoutGrid,
  FileText,
  Loader2,
} from "lucide-react";
import { type Category, type CategoryStatus } from "@/mock-data/categories";
import { cn } from "@/lib/utils";
import { Pill, PillIndicator } from "@/components/kibo-ui/pill";
import { Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { gooeyToast } from "goey-toast";

function StatusBadge({ status }: { status: CategoryStatus }) {
  if (status === "active") {
    return (
      <Pill variant="secondary">
        <PillIndicator variant="success" pulse />
        Active
      </Pill>
    );
  }
  return (
    <Pill variant="outline" className="text-muted-foreground bg-muted/20 border-transparent">
      <PillIndicator variant="warning" />
      <span className="italic">Archived</span>
    </Pill>
  );
}

interface CategoriesTableProps {
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  // This prop allows parent to trigger a refresh (e.g. after add/edit)
  refreshTrigger?: number;
}

export function CategoriesTable({
  onEditCategory,
  onDeleteCategory,
  refreshTrigger = 0,
}: CategoriesTableProps) {
  // State for data
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | "all">("all");

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
        search: debouncedSearchQuery,
        status: statusFilter,
      });

      const res = await fetch(`/api/categories?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const result = await res.json();

      setData(result.categories || []);
      setTotalRows(result.pagination?.totalCategories || 0);
      setPageCount(result.pagination?.totalPages || 0);
    } catch (error: any) {
      gooeyToast.error('Failed to load categories', {
        description: error.message || 'Error fetching category list',
      });
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHomeDisplay = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/categories/home`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, showOnHome: !currentValue })
      });
      if (!res.ok) throw new Error("Failed to update home display");
      
      // Update local state
      setData(prev => prev.map(c => c._id === id ? { ...c, showOnHome: !currentValue } : c));

      gooeyToast.success('Setting updated', {
        description: `Successfully ${!currentValue ? 'enabled' : 'disabled'} "Show on Home" for this category.`,
      });
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Failed to update category setting',
      });
    }
  };

  // Trigger fetch on dependencies
  useEffect(() => {
    fetchCategories();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearchQuery, statusFilter, refreshTrigger]);

  const columns = useMemo<ColumnDef<Category>[]>(
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
        accessorKey: "name",
        header: "Category",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <div
                className="size-2.5 rounded-full shrink-0 shadow-sm border border-black/5"
                style={{ backgroundColor: c.color }}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{c.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono italic">/{c.slug}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="text-sm text-muted-foreground max-w-[300px] truncate leading-relaxed">
            {row.original.description || <span className="italic opacity-50 text-[10px]">No description</span>}
          </p>
        ),
      },
      {
        accessorKey: "totalPost",
        header: "Posts",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm tabular-nums font-medium">
            <FileText className="size-3.5 text-muted-foreground" />
            {row.original.totalPost || 0}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "showOnHome",
        header: "Home",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-2">
              <Checkbox 
                id={`home-${c._id}`}
                checked={c.showOnHome} 
                onCheckedChange={() => toggleHomeDisplay(c._id as string, !!c.showOnHome)} 
              />
              <label htmlFor={`home-${c._id}`} className="text-[10px] font-medium uppercase text-muted-foreground cursor-pointer">Show</label>
            </div>
          );
        }
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.original?.createdAt ? format(row.original.createdAt, "dd MMM yyyy") : "N/A"}
          </span>
        )
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-start">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              onClick={() => onEditCategory(row.original)}
            >
              <Edit className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              onClick={() => onDeleteCategory(row.original._id as any)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onEditCategory, onDeleteCategory]
  );

  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: data,
    columns,
    pageCount: pageCount,
    state: {
      pagination,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const hasActiveFilters = statusFilter !== "all";
  const { pageIndex, pageSize } = pagination;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-semibold text-base flex items-center gap-2">
          Categories List
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full lowercase">
            {totalRows} Items
          </span>
          {isLoading && <Loader2 className="size-3 animate-spin text-primary" />}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }}
              className="pl-8 h-9 w-full sm:w-[220px] text-sm bg-muted/30 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
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
                checked={statusFilter === "all"}
                onCheckedChange={() => {
                  setStatusFilter("all");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                All Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "active"}
                onCheckedChange={() => {
                  setStatusFilter("active");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "archived"}
                onCheckedChange={() => {
                  setStatusFilter("archived");
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}
              >
                Archived
              </DropdownMenuCheckboxItem>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setStatusFilter("all");
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
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-16"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutGrid className="size-10 opacity-10" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">No categories found</p>
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
                  className="group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-0">
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
              ? "0 categories"
              : `Showing ${from} to ${to} of ${totalRows} categories`}
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

