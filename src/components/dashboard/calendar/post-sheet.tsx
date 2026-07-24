"use client";

import { format } from "date-fns";
import {
  FileText,
  Clock,
  CheckCircle2,
  User,
  Calendar as CalendarIcon,
  Tag,
  ExternalLink,
} from "@/components/icons";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScheduledPost } from "@/store/calendar-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PostSheetProps {
  post: ScheduledPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostSheet({ post, open, onOpenChange }: PostSheetProps) {
  const router = useRouter();

  if (!post) return null;

  const statusIcons = {
    draft: FileText,
    scheduled: Clock,
    published: CheckCircle2,
  };

  const StatusIcon = statusIcons[post.status] || FileText;

  const handleEditClick = () => {
    onOpenChange(false);
    if (post._id) {
      router.push(`/dashboard/posts/edit/${post._id}`);
    } else {
      router.push(`/dashboard/posts`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[600px]">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle className="text-base font-medium sm:text-lg">
            {post.title}
            <p className="text-muted-foreground text-xs font-normal mt-0.5">
              Blog post schedule and status details from database.
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider border-0 flex items-center gap-1",
                post.status === "draft" && "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300",
                post.status === "scheduled" && "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
                post.status === "published" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
              )}
            >
              <StatusIcon className="size-3" />
              {post.status}
            </Badge>

            {post.category && (
              <Badge variant="secondary" className="text-[10px] font-semibold flex items-center gap-1">
                <Tag className="size-3 text-muted-foreground" />
                {post.category}
              </Badge>
            )}
          </div>

          {/* Schedule Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <CalendarIcon className="size-3 text-primary" /> Date
              </p>
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(post.date), "PPP")}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Time Slot
              </p>
              <p className="text-sm font-semibold text-foreground">
                {post.startTime} - {post.endTime}
              </p>
            </div>
          </div>

          {/* Author Details */}
          <div className="p-3 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Author:</span>
              <span className="text-xs font-semibold text-foreground">{post.author || "Admin"}</span>
            </div>
            {post.slug && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono truncate max-w-[200px]">
                /{post.slug}
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto h-9 text-xs">
              Close
            </Button>
          </DialogClose>

          <Button
            onClick={handleEditClick}
            className="w-full sm:w-auto h-9 text-xs gap-1.5"
          >
            <Pencil className="size-3.5" />
            Edit Post in Database
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
