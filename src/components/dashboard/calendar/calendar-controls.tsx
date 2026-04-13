"use client";

import { useState } from "react";
import {
  Search,
  Settings,
  Calendar as CalendarIcon,
  Filter,
  Check,
  FileText,
  Clock,
  CheckCircle2,
} from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/store/calendar-store";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function CalendarControls() {
  const {
    searchQuery,
    setSearchQuery,
    goToToday,
    goToDate,
    currentWeekStart,
    statusFilter,
    setStatusFilter,
  } = useCalendarStore();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const weekStart = format(currentWeekStart, "MMM dd");
  const weekEnd = format(
    new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    "MMM dd yyyy"
  );

  const hasActiveFilters = statusFilter !== "all";

  return (
    <div className="px-3 md:px-6 py-4 border rounded-xl border-border mb-4">
      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[280px] shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-8 bg-background border-primary/10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
          >
            <Settings className="size-3.5" />
          </Button>
        </div>

        <Button
          variant="outline"
          className="h-8 px-3 shrink-0 border-primary/10"
          onClick={goToToday}
        >
          Today
        </Button>

        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 px-3 gap-2 justify-start text-left font-normal shrink-0 border-primary/10",
                "hover:bg-accent"
              )}
            >
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span className="text-xs text-foreground">
                {weekStart} - {weekEnd}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentWeekStart}
              onSelect={(date) => {
                if (date) {
                  goToDate(date);
                  setDatePickerOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="ml-auto" />

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("h-8 px-3 gap-2 border-primary/10", hasActiveFilters && "bg-accent")}
            >
              <Filter className="size-4" />
              <span className="hidden sm:inline text-xs">Status</span>
              {hasActiveFilters && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-4 w-[240px]"
            align="end"
          >
            <div className="space-y-4 w-full">
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  Post Status
                </h4>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setStatusFilter("all")}
                  >
                    <span className="text-sm">All statuses</span>
                    {statusFilter === "all" && (
                      <Check className="size-4 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setStatusFilter("draft")}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-sm">Draft</span>
                    </div>
                    {statusFilter === "draft" && (
                      <Check className="size-4 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setStatusFilter("scheduled")}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="size-4 text-blue-500" />
                      <span className="text-sm">Scheduled</span>
                    </div>
                    {statusFilter === "scheduled" && (
                      <Check className="size-4 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-9 px-3"
                    onClick={() => setStatusFilter("published")}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-sm">Published</span>
                    </div>
                    {statusFilter === "published" && (
                      <Check className="size-4 text-primary" />
                    )}
                  </Button>
                </div>
              </div>

              {hasActiveFilters && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9"
                    onClick={() => {
                      setStatusFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
