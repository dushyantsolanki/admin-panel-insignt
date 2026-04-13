"use client";

import { ExternalLink, FileText, Clock, CheckCircle2 } from "@/components/icons";
import { ScheduledPost } from "@/store/calendar-store";
import { getEventDuration } from "./calendar-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventCardProps {
  post: ScheduledPost;
  style: React.CSSProperties;
  onClick?: () => void;
}

export function EventCard({ post, style, onClick }: EventCardProps) {
  const duration = getEventDuration(post.startTime, post.endTime);
  const isVeryShort = duration < 30;
  const isMedium = duration >= 30 && duration < 60;
  
  const statusColors = {
    draft: "bg-slate-500",
    scheduled: "bg-blue-500",
    published: "bg-emerald-500",
  };

  const statusIcons = {
    draft: FileText,
    scheduled: Clock,
    published: CheckCircle2,
  };

  const StatusIcon = statusIcons[post.status];

  if (isVeryShort) {
    return (
      <div
        className="absolute left-2 right-2 bg-card border border-border shadow-sm rounded-lg px-2 py-1 z-10 flex items-center gap-1.5 cursor-pointer hover:bg-muted transition-all active:scale-[0.98]"
        style={style}
        onClick={onClick}
      >
        <div className={cn("size-1.5 rounded-full shrink-0", statusColors[post.status])} />
        <h4 className="text-[10px] font-semibold text-foreground truncate flex-1">
          {post.title}
        </h4>
        <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
          {post.startTime}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute left-2 right-2 bg-card border border-border shadow-sm rounded-lg p-2 md:p-3 z-10 cursor-pointer hover:bg-muted transition-all active:scale-[0.98] group",
        post.status === "scheduled" && "border-blue-500/20 bg-blue-50/5 dark:bg-blue-500/5",
        post.status === "published" && "border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-500/5"
      )}
      style={style}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1.5 h-full">
        <div className="flex-1 min-h-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                "text-[11px] md:text-xs font-bold text-foreground leading-tight",
                duration <= 60 ? "truncate whitespace-nowrap" : "line-clamp-2"
              )}
            >
              {post.title}
            </h4>
            <StatusIcon className={cn("size-3 shrink-0 opacity-70", 
              post.status === "scheduled" ? "text-blue-500" : 
              post.status === "published" ? "text-emerald-500" : 
              "text-muted-foreground"
            )} />
          </div>
          
          <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {post.startTime} - {post.endTime}
          </p>
        </div>

        {duration >= 45 && (
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-[9px] text-muted-foreground truncate">
              By {post.author || "Admin"}
            </span>
            <Badge variant="outline" className={cn(
              "text-[8px] h-4 px-1.5 font-bold uppercase tracking-tighter border-0",
              post.status === "draft" && "bg-slate-100 text-slate-600 dark:bg-slate-900",
              post.status === "scheduled" && "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
              post.status === "published" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
            )}>
              {post.status}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
