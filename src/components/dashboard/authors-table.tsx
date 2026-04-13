"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  Users,
} from "@/components/icons";
import { Pill, PillAvatar, PillIndicator, PillIcon } from "@/components/kibo-ui/pill";
import { Lock, FileText, User as UserIcon, Plus } from "@/components/icons";
import { type AuthorRole, type AuthorStatus } from "@/mock-data/authors";
import { cn } from "@/lib/utils";
import { type Author } from "./author-modal";
import { Loader2, Trash2 } from "lucide-react";
import { format } from 'date-fns';

interface AuthorsTableProps {
  authors: Author[];
  isLoading: boolean;
  onEditAuthor?: (author: Author) => void;
  onDeleteAuthor?: (id: string) => void;
}

function RoleBadge({ role }: { role: AuthorRole }) {
  const iconMap = {
    admin: Lock,
    editor: FileText,
    contributor: UserIcon,
  };

  const variantMap: Record<AuthorRole, string> = {
    admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    editor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    contributor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  };

  return (
    <Pill className={cn("capitalize", variantMap[role])}>
      <PillIcon icon={iconMap[role]} />
      {role}
    </Pill>
  );
}

function StatusBadge({ status }: { status: AuthorStatus }) {
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
      <PillIndicator variant="error" />
      Inactive
    </Pill>
  );
}

export function AuthorsTable({ authors, isLoading, onEditAuthor, onDeleteAuthor }: AuthorsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [roleFilter, setRoleFilter] = useState<AuthorRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AuthorStatus | "all">("all");

  const columns = useMemo<ColumnDef<Author>[]>(
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
        header: "Author",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <Pill variant="outline" className="h-14 border-transparent bg-transparent hover:bg-muted/30 transition-colors pl-1">
              <PillAvatar
                fallback={a.name.slice(0, 2)}
                src={a.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${a.name}`}
                className="size-10 rounded-xl"
              />
              <div className="flex flex-col min-w-0 ml-1">
                <span className="text-sm font-semibold text-foreground truncate">{a.name}</span>
                <span className="text-[10px] text-muted-foreground truncate font-medium">{a.email}</span>
              </div>
            </Pill>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "totalPost",
        header: "Total Posts",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{row.original.totalPost || "0"}</span>
          </div>
        )
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Join Date",
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
              onClick={() => onEditAuthor?.(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={() => row.original._id && onDeleteAuthor?.(row.original._id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    let result = authors;
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((a) => a.role === roleFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result;
  }, [authors, debouncedSearchQuery, roleFilter, statusFilter]);

  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const hasActiveFilters = roleFilter !== "all" || statusFilter !== "all";
  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = table.getState().pagination.pageIndex;
  const totalRows = filteredData.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-semibold text-base flex items-center gap-2">
          Authors List
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full lowercase">
            {totalRows} total
          </span>
          {isLoading && <Loader2 className="size-3 animate-spin text-primary" />}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input
              placeholder="Search authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[220px] text-sm bg-muted/30 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/50">
                <Filter className="size-4" />
                Filter
                {hasActiveFilters && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1.5 uppercase tracking-wider">Role</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={roleFilter === "all"}
                onCheckedChange={() => setRoleFilter("all")}
              >
                All Roles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter === "admin"}
                onCheckedChange={() => setRoleFilter("admin")}
              >
                Admin
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter === "editor"}
                onCheckedChange={() => setRoleFilter("editor")}
              >
                Editor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter === "contributor"}
                onCheckedChange={() => setRoleFilter("contributor")}
              >
                Contributor
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium px-2 py-1.5 uppercase tracking-wider">Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                All Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "active"}
                onCheckedChange={() => setStatusFilter("active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "inactive"}
                onCheckedChange={() => setStatusFilter("inactive")}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="text-primary focus:text-primary font-medium"
                  >
                    Clear all filters
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
                  <TableHead key={header.id} className="h-10">
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-6 w-full bg-muted/50 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-16"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Users className="size-10 opacity-10" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No authors found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
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
              ? "0 authors"
              : `Showing ${from} to ${to} of ${totalRows} authors`}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
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
            {pageIndex + 1} / {table.getPageCount() || 1}
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
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
