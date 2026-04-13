"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/icons";
import { recentComments } from "@/mock-data/dashboard";
import { useDashboardStore } from "@/store/dashboard-store";
import { MessageSquare, Clock } from "@/components/icons";

export function RecentComments() {
  const {
    commentsSearchQuery,
    setCommentsSearchQuery,
  } = useDashboardStore();

  const filteredComments = useMemo(() => {
    let result = recentComments;
    if (commentsSearchQuery.trim()) {
      const q = commentsSearchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.authorName.toLowerCase().includes(q) ||
          c.postTitle.toLowerCase().includes(q) ||
          c.snippet.toLowerCase().includes(q)
      );
    }
    return result;
  }, [commentsSearchQuery]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-medium text-base">Recent Comments</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              value={commentsSearchQuery}
              onChange={(e) => setCommentsSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[200px] text-sm bg-muted/50"
            />
          </div>
        </div>
      </div>
      <div className="divide-y overflow-y-auto max-h-[400px] no-scrollbar">
        {filteredComments.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No comments match your search.
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="group flex flex-col gap-1 px-4 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-foreground">{comment.authorName}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <Clock className="size-3" />
                  {comment.date}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                on <span className="font-bold text-primary/80 group-hover:text-primary transition-colors">{comment.postTitle}</span>
              </p>
              <p className="text-sm text-foreground/80 mt-1 italic">
                &ldquo;{comment.snippet}&rdquo;
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
