"use client";

import { CalendarView } from "@/components/dashboard/calendar/calendar-view";
import { CalendarControls } from "@/components/dashboard/calendar/calendar-controls";
import { useCalendarStore } from "@/store/calendar-store";
import { format } from "date-fns";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";

import { CreatePostDialog } from "@/components/dashboard/calendar/create-post-dialog";
import { useState } from "react";

export default function CalendarPage() {
  const { currentWeekStart, posts } = useCalendarStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const scheduledCount = posts.filter(p => p.status === "scheduled").length;
  const draftCount = posts.filter(p => p.status === "draft").length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      <CreatePostDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Calendar</h2>
          <p className="text-muted-foreground text-sm">
            You have {scheduledCount} posts scheduled and {draftCount} drafts in the works.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 font-semibold shadow-sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="size-4" />
            Schedule Post
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-card  overflow-hidden">
        <CalendarControls />
        <div className="flex-1 overflow-hidden">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}
