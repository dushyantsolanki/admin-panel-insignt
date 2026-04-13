"use client";

import { format } from "date-fns";
import {
  FileText,
  Clock,
  CheckCircle2,
  User,
  Calendar as CalendarIcon,
  X
} from "@/components/icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScheduledPost } from "@/store/calendar-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PostSheetProps {
  post: ScheduledPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostSheet({ post, open, onOpenChange }: PostSheetProps) {
  if (!post) return null;

  const statusIcons = {
    draft: FileText,
    scheduled: Clock,
    published: CheckCircle2,
  };

  const StatusIcon = statusIcons[post.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md border-l border-primary/10 shadow-2xl">
        <SheetHeader className="space-y-4 pr-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-widest border-0",
              post.status === "draft" && "bg-slate-100 text-slate-600 dark:bg-slate-900",
              post.status === "scheduled" && "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
              post.status === "published" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
            )}>
              {post.status}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold leading-tight decoration-primary/30 decoration-2 underline-offset-4">
            {post.title}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground flex items-center gap-2">
            <User className="size-4 shrink-0" />
            Written by <span className="font-semibold text-foreground">{post.author || "Admin"}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
              <CalendarIcon className="size-3" /> Publication Schedule
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/20 border border-primary/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Date</p>
                <p className="text-sm font-semibold">{format(new Date(post.date), "PPP")}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-primary/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Time</p>
                <p className="text-sm font-semibold">{post.startTime} - {post.endTime}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-primary/5" />

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
              <StatusIcon className="size-3" /> Publishing Workflow
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn("size-2 rounded-full", post.status !== "draft" ? "bg-emerald-500" : "bg-primary shadow-sm")} />
                <span className={cn("text-sm", post.status !== "draft" ? "text-muted-foreground line-through opacity-50" : "font-medium")}>
                  Drafting content
                </span>
                {post.status === "draft" && <Badge className="ml-auto text-[10px]">Active</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("size-2 rounded-full", post.status === "published" ? "bg-emerald-500" : post.status === "scheduled" ? "bg-blue-500 shadow-sm" : "bg-muted")} />
                <span className={cn("text-sm", post.status === "published" ? "text-muted-foreground line-through opacity-50" : post.status === "scheduled" ? "font-medium" : "text-muted-foreground")}>
                  Scheduled for publication
                </span>
                {post.status === "scheduled" && <Badge className="ml-auto text-[10px] bg-blue-500">Queued</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <div className={cn("size-2 rounded-full", post.status === "published" ? "bg-emerald-500 shadow-sm" : "bg-muted")} />
                <span className={cn("text-sm", post.status === "published" ? "font-medium" : "text-muted-foreground")}>
                  Published live
                </span>
                {post.status === "published" && <Badge className="ml-auto text-[10px] bg-emerald-500">Live</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 right-6 flex flex-col gap-3 mt-auto">
          <Button className="w-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            Edit Full Post
          </Button>
          <Button variant="outline" className="w-full border-primary/10 font-bold hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all">
            Cancel Publication
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
