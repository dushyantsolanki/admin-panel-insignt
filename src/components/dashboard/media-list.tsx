"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  EllipsisVertical as MoreVertical,
  Copy,
  Eye,
  Trash2,
  Image,
  Video,
  Music,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { gooeyToast } from "goey-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface MediaItemRecord {
  _id: string;
  name: string;
  type: "image" | "video" | "audio";
  url: string;
  size: string;
  starred: boolean;
  r2Key?: string;
  storageProvider?: "cloudflare_r2";
  createdAt?: string;
}

interface MediaListProps {
  viewMode: "grid" | "list";
  filterType?: "image" | "video" | "audio" | null;
  searchQuery?: string;
  refreshTrigger?: number;
  onStatsLoaded?: (stats: any) => void;
}

export function MediaList({
  viewMode,
  filterType,
  searchQuery = "",
  refreshTrigger = 0,
  onStatsLoaded,
}: MediaListProps) {
  const [mediaItems, setMediaItems] = useState<MediaItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItemRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Backend Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedia, setTotalMedia] = useState(0);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchQuery,
        type: filterType || "all",
      });

      const res = await fetch(`/api/media?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setMediaItems(json.media || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalMedia(json.pagination?.totalMedia || 0);
        if (onStatsLoaded && json.stats) {
          onStatsLoaded(json.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching media items:", err);
      gooeyToast.error("Failed to load media items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [page, pageSize, filterType, searchQuery, refreshTrigger]);

  useEffect(() => {
    setPage(1);
  }, [filterType, searchQuery]);

  const toggleStarred = async (id: string, currentStarred: boolean) => {
    // Optimistic UI update
    setMediaItems((items) =>
      items.map((item) =>
        item._id === id ? { ...item, starred: !currentStarred } : item
      )
    );

    if (selectedMedia && selectedMedia._id === id) {
      setSelectedMedia((prev) => (prev ? { ...prev, starred: !currentStarred } : null));
    }

    try {
      await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !currentStarred }),
      });
      gooeyToast.success(!currentStarred ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      console.error("Error toggling star:", err);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    gooeyToast.success("Copied to clipboard!");
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete media");

      fetchMedia();
      setSelectedMedia(null);
      gooeyToast.success("Media file deleted");
    } catch (err: any) {
      gooeyToast.error(err.message || "Failed to delete media");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-3">
            <div className="aspect-video w-full bg-muted/60 animate-pulse rounded-lg" />
            <div className="h-4 w-3/4 bg-muted/60 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted/60 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl bg-card">
        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border/50">
          <Image className="size-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1 text-foreground">No media files found</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Upload media files to use them in your blog posts.
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((file) => (
            <div
              key={file._id}
              className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer shadow-xs"
              onClick={() => setSelectedMedia(file)}
            >
              {/* Media Preview Thumbnail */}
              <div className="aspect-video w-full bg-muted relative border-b border-border/60 overflow-hidden flex items-center justify-center group-hover:opacity-90 transition-opacity">
                {file.type === "image" ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : file.type === "video" ? (
                  <video src={file.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-950/20 text-emerald-500 p-4 gap-2 border border-emerald-500/10">
                    <Music className="size-8 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Audio File</span>
                  </div>
                )}

                {/* Direct Star Button overlay on top-right of image card */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarred(file._id, file.starred);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-xs text-white hover:text-amber-400 transition-colors z-10"
                  title={file.starred ? "Unstar media" : "Star media"}
                >
                  <Star className={cn("size-3.5", file.starred ? "fill-amber-400 text-amber-400" : "")} />
                </button>
              </div>

              {/* Media Footer */}
              <div className="p-3 flex items-center justify-between gap-2 bg-card">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-foreground truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 font-mono">
                    <span>{file.size}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedMedia(file)}>
                        <Eye className="mr-2 size-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyToClipboard(file.url)}>
                        <Copy className="mr-2 size-4" /> Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStarred(file._id, file.starred)}>
                        <Star className={cn("mr-2 size-4", file.starred ? "fill-amber-400 text-amber-400" : "")} />
                        {file.starred ? "Unstar" : "Star"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(file._id)}
                      >
                        <Trash2 className="mr-2 size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs divide-y divide-border/60">
          {mediaItems.map((file) => (
            <div
              key={file._id}
              onClick={() => setSelectedMedia(file)}
              className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-12 h-10 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted flex items-center justify-center">
                  {file.type === "image" ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : file.type === "video" ? (
                    <Video className="size-5 text-purple-500" />
                  ) : (
                    <Music className="size-5 text-emerald-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-foreground truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </h4>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-mono">
                    <span className="uppercase font-bold">{file.type}</span>
                    <span>&middot;</span>
                    <span>{file.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => toggleStarred(file._id, file.starred)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-amber-400 transition-colors"
                  title={file.starred ? "Unstar media" : "Star media"}
                >
                  <Star className={cn("size-4", file.starred ? "fill-amber-400 text-amber-400" : "")} />
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(file.url)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                >
                  <Copy className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteId(file._id)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backend Pagination Controls */}
      {totalMedia > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-foreground">{Math.min(page * pageSize, totalMedia)}</span> of{" "}
              <span className="font-semibold text-foreground">{totalMedia}</span> files
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16 text-xs bg-card border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-3.5" />
              </Button>

              <span className="px-2 font-medium text-foreground font-mono">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exact Original Premium Sheet UI */}
      <Sheet open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] overflow-y-auto p-0 border-l flex flex-col gap-0 [&>button]:bg-background/90 [&>button]:backdrop-blur-xs [&>button]:size-8 [&>button]:rounded-full [&>button]:shadow-xs [&>button]:border [&>button]:border-border [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button>svg]:size-4"
        >
          {selectedMedia && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
              {/* Premium Hero Header */}
              <div className="relative w-full border-b bg-muted/30">
                <div className="aspect-video w-full flex flex-col items-center justify-center p-8">
                  {selectedMedia.type === "image" ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xs border bg-background/50 flex items-center justify-center">
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : selectedMedia.type === "video" ? (
                    <div className="w-full h-full rounded-xl overflow-hidden shadow-xs border border-slate-800 bg-slate-950 flex items-center justify-center group relative">
                      <video
                        src={selectedMedia.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-xl overflow-hidden shadow-xs border border-emerald-500/20 bg-emerald-950/30 p-6 flex flex-col items-center justify-center gap-4">
                      <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Music className="size-8 animate-pulse" />
                      </div>
                      <audio src={selectedMedia.url} controls className="w-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Header Title & Subtitle */}
              <div className="px-4 pt-4 pb-2 min-w-0">
                <SheetHeader className="text-left space-y-1 mb-4 mr-8 min-w-0 p-0 px-2 py-4">
                  <SheetTitle className="text-2xl font-bold tracking-tight truncate">
                    {selectedMedia.name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-1.5 text-sm">
                    {selectedMedia.type === "image" ? (
                      <Image className="size-4" />
                    ) : selectedMedia.type === "video" ? (
                      <Video className="size-4" />
                    ) : (
                      <Music className="size-4 text-emerald-500" />
                    )}
                    <span className="capitalize">{selectedMedia.type}</span>
                    <span>&middot;</span>
                    <span>{selectedMedia.size}</span>
                    <span>&middot;</span>
                    <span>
                      {selectedMedia.createdAt
                        ? format(new Date(selectedMedia.createdAt), "dd MMM yyyy")
                        : "Recently uploaded"}
                    </span>
                  </SheetDescription>
                </SheetHeader>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-3 w-full">
                  <Button
                    onClick={() => copyToClipboard(selectedMedia.url)}
                    className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary shadow-none border border-primary/10 transition-colors"
                  >
                    <Copy className="mr-2 size-4" /> Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedMedia.url, "_blank")}
                    className="flex-1 shadow-none transition-colors"
                  >
                    <Eye className="mr-2 size-4" /> Preview
                  </Button>
                </div>
              </div>

              {/* Detailed Info / Metadata List */}
              <div className="px-6 py-6 flex-1 flex flex-col">
                <h4 className="text-sm font-semibold tracking-tight text-foreground mb-3">
                  Information
                </h4>
                <div className="rounded-xl border bg-card/50 text-card-foreground overflow-hidden mb-8">
                  <div className="flex flex-col divide-y divide-border/50">
                    <div className="flex justify-between items-center px-4 py-2 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Favorite</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -mr-2 text-foreground font-medium shrink-0"
                        onClick={() => toggleStarred(selectedMedia._id, selectedMedia.starred)}
                      >
                        <Star
                          className={cn(
                            "size-3.5 mr-1.5",
                            selectedMedia.starred
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          )}
                        />
                        {selectedMedia.starred ? "Starred" : "Unstarred"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Direct Link</span>
                      <span className="truncate text-right text-xs font-mono select-all min-w-0 flex-1">
                        {selectedMedia.url}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">File Size</span>
                      <span className="font-medium text-right min-w-0 truncate">
                        {selectedMedia.size}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Uploaded</span>
                      <span className="font-medium text-right min-w-0 truncate">
                        {selectedMedia.createdAt
                          ? format(new Date(selectedMedia.createdAt), "dd MMM yyyy hh:mm a")
                          : "Recently"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 text-sm bg-muted/20 min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Internal ID</span>
                      <span className="font-medium text-xs font-mono text-muted-foreground min-w-0 truncate">
                        {selectedMedia._id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteId(selectedMedia._id)}
                    className="w-full text-destructive bg-destructive/10 hover:text-destructive shadow-none transition-colors"
                  >
                    <Trash2 className="mr-2 size-4 text-destructive" /> Move to Trash
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) return executeDelete(deleteId);
        }}
        title="Delete Media File?"
        description="Are you sure you want to delete this media file permanently?"
      />
    </>
  );
}
