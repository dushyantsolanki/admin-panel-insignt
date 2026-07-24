"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Type, User } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCalendarStore, ScheduledPost } from "@/store/calendar-store";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gooeyToast } from "goey-toast";
import { PostSelectCombobox, DBPostItem } from "./post-select-combobox";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
}: CreatePostDialogProps) {
  const { addPost, goToDate, fetchPostsFromDB } = useCalendarStore();
  const [selectedDBPost, setSelectedDBPost] = useState<DBPostItem | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [status, setStatus] = useState<ScheduledPost["status"]>("draft");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authorName = typeof selectedDBPost?.author === "object" ? selectedDBPost.author?.name || "Admin" : selectedDBPost?.author || "Admin";

  const handleSelectPostFromDB = (post: DBPostItem) => {
    setSelectedDBPost(post);
    setTitle(post.title);
    if (post.status === "draft" || post.status === "published") {
      setStatus(post.status);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const postTitleToUse = selectedDBPost?.title || title;
    if (!postTitleToUse || !date || !startTime || !endTime) {
      return;
    }

    setIsSubmitting(true);
    try {
      let savedPost: any;

      if (selectedDBPost?._id) {
        // Update ONLY the related fields (status and publish date) of the selected post in DB
        const res = await fetch(`/api/posts/${selectedDBPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            date: date.toISOString(),
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to update post in database");
        }

        savedPost = await res.json();
      } else {
        // Create new post if none was selected from DB
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug,
            status,
            date: date.toISOString(),
            content: `<p>Scheduled post content for ${title}</p>`,
            excerpt: `Scheduled post titled ${title}`,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to schedule post");
        }

        savedPost = await res.json();
      }

      gooeyToast.success("Post updated successfully", {
        description: `Updated status to "${status}" for ${format(date, "MMM dd, yyyy")}`,
      });

      goToDate(date);
      await fetchPostsFromDB();

      // Reset fields
      setSelectedDBPost(null);
      setTitle("");
      setDate(new Date());
      setStartTime("09:00");
      setEndTime("10:00");
      setStatus("draft");
      onOpenChange(false);
    } catch (err: any) {
      gooeyToast.error("Failed to save post", {
        description: err.message || "An error occurred while saving post",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[600px]">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle className="text-base font-medium sm:text-lg">
            Schedule New Post
            <p className="text-muted-foreground text-xs font-normal mt-0.5">
              Select an existing post from database or enter a new title to schedule.
            </p>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
            {/* Post Select Combobox */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Select Post
              </Label>
              <PostSelectCombobox
                selectedPost={selectedDBPost}
                onSelectPost={handleSelectPostFromDB}
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Publish Date
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left text-sm border-border/60 bg-muted/20 hover:bg-muted/30",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4 text-primary" />
                    {date ? format(date, "PPP") : <span>Pick a publish date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-border shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="startTime" className="text-xs font-semibold text-foreground">
                  Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-9 h-9 text-sm bg-muted/20 border-border/60"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="endTime" className="text-xs font-semibold text-foreground">
                  End Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-9 h-9 text-sm bg-muted/20 border-border/60"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="status" className="text-xs font-semibold text-foreground">
                  Publication Status
                </Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger id="status" className="h-9 w-full text-sm bg-muted/20 border-border/60">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="author" className="text-xs font-semibold text-foreground">
                  Author Name (Read Only)
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="author"
                    value={authorName}
                    readOnly
                    disabled
                    className="pl-9 h-9 text-sm bg-muted/50 border-border/40 text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto h-9 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 text-xs font-medium"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
