"use client";

import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useReactTable,
  getCoreRowModel,
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
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  User,
  Plus,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { Pill, PillIndicator } from "@/components/kibo-ui/pill";
import { Loader2, Trash2, ShieldAlert } from "lucide-react";
import { gooeyToast } from "goey-toast";

export type SubscriberStatus = "active" | "unsubscribed" | "pending";

export interface Subscriber {
  _id: string;
  email: string;
  status: SubscriberStatus;
  source: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: SubscriberStatus }) {
  if (status === "pending") {
    return (
      <Pill variant="secondary">
        <PillIndicator variant="info" pulse />
        Pending
      </Pill>
    );
  }
  if (status === "unsubscribed") {
    return (
      <Pill variant="secondary">
        <PillIndicator variant="error" />
        Unsubscribed
      </Pill>
    );
  }
  if (status === "active") {
    return (
      <Pill variant="secondary">
        <PillIndicator variant="success" />
        Active
      </Pill>
    );
  }
  return null;
}

export function SubscribersTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, pending: 0 });

  // Add Subscriber Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newSource, setNewSource] = useState("admin-panel");
  const [isAdding, setIsAdding] = useState(false);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        search: debouncedSearchQuery,
        status: statusFilter,
      });

      const response = await fetch(`/api/subscribers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch subscribers");

      const data = await response.json();
      setSubscribers(data.subscribers);
      setTotalRows(data.pagination.totalSubscribers);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      gooeyToast.error("Failed to load subscribers", {
        description: error.message || "Error fetching subscribers list",
      });
      console.error("Error fetching subscribers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [debouncedSearchQuery, statusFilter, pageIndex, pageSize]);

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, source: newSource }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to add subscriber");
      }

      gooeyToast.success("Subscriber added successfully!");
      setIsAddOpen(false);
      setNewEmail("");
      setNewSource("admin-panel");
      fetchSubscribers();
    } catch (error: any) {
      gooeyToast.error("Error adding subscriber", {
        description: error.message,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (sub: Subscriber) => {
    const nextStatus: SubscriberStatus = sub.status === "active" ? "unsubscribed" : "active";
    
    try {
      const response = await fetch(`/api/subscribers/${sub._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      gooeyToast.success(`Subscriber marked as ${nextStatus}`);
      fetchSubscribers();
    } catch (error: any) {
      gooeyToast.error("Update failed", { description: error.message });
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this subscriber?")) return;

    try {
      const response = await fetch(`/api/subscribers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete subscriber");

      gooeyToast.success("Subscriber permanently deleted");
      fetchSubscribers();
    } catch (error: any) {
      gooeyToast.error("Delete failed", { description: error.message });
    }
  };

  const columns = useMemo<ColumnDef<Subscriber>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email Address",
        cell: ({ row }) => {
          const email = row.original.email;
          const initial = email.slice(0, 2).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs bg-purple-500/10 text-purple-600 font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{email}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "source",
        header: "Signup Source",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground capitalize">
            {row.original.source || "footer"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Subscribed Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {new Date(row.original.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const sub = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-3 hover:bg-muted font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleToggleStatus(sub)}
              >
                {sub.status === "active" ? "Unsubscribe" : "Activate"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteSubscriber(sub._id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: subscribers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalRows / pageSize),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      }
    },
  });

  const hasActiveFilters = statusFilter !== "all";
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Subscribers</p>
          <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unsubscribed</p>
          <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{stats.unsubscribed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending / Verification</p>
          <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{stats.pending}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base flex items-center gap-2">
            Subscribers List
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full lowercase">
              {totalRows} Items
            </span>
            {isLoading && <Loader2 className="size-3 animate-spin text-primary" />}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[240px] text-sm bg-muted/30 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
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
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                All subscribers
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === "active"}
                onCheckedChange={() => setStatusFilter("active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "unsubscribed"}
                onCheckedChange={() => setStatusFilter("unsubscribed")}
              >
                Unsubscribed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === "pending"}
                onCheckedChange={() => setStatusFilter("pending")}
              >
                Pending
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setIsAddOpen(true)}>
            <Plus className="size-4" />
            Add Subscriber
          </Button>
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-6 w-full bg-muted/50 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : subscribers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground py-16"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Mail className="size-10 opacity-10" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">No subscribers found</p>
                      <p className="text-xs">Adjust your search or filters to see results.</p>
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
                    <TableCell key={cell.id} className="py-3">
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
              ? "0 subscribers"
              : `Showing ${from} to ${to} of ${totalRows} subscribers`}
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

      {/* Manual Subscriber Registration Modal */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && setIsAddOpen(false)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddSubscriber}>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold border-b pb-4">
                Add Subscriber Manually
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. reader@domain.com"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Signup Source Tag</label>
                <Select value={newSource} onValueChange={setNewSource}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin-panel">Admin Panel (Manual)</SelectItem>
                    <SelectItem value="imported">Imported List</SelectItem>
                    <SelectItem value="partner">Partner Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="border-t pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-10">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="h-10" disabled={isAdding}>
                {isAdding ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Add Subscriber
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
