"use client";

import { Star, EllipsisVertical as MoreVertical, Share2, Copy, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaData, MediaItem } from "@/mock-data/media";
import { useState, useMemo } from "react";
import type { MediaType } from "@/mock-data/media";

interface MediaListProps {
  viewMode: "grid" | "list";
  filterType?: MediaType | null;
  searchQuery?: string;
}

export function MediaList({ viewMode, filterType, searchQuery = "" }: MediaListProps) {
  // Simple local state for toggle starred (in a real app, this would be a store/API)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(mediaData);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const filteredItems = useMemo(() => {
    let items = mediaItems;
    if (filterType) {
      items = items.filter((item) => item.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }
    return items;
  }, [mediaItems, filterType, searchQuery]);

  const toggleStarred = (id: string) => {
    setMediaItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  };

  const renderContent = () => {
    if (filteredItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Image className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">No media files found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Upload media files to use them in your blog posts.
          </p>
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex flex-col rounded-xl border bg-card overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
                  onClick={() => setSelectedMedia(file)}
                >
                  {/* Media Preview Thumbnail */}
                  <div className="aspect-video w-full bg-muted relative border-b overflow-hidden flex items-center justify-center group-hover:opacity-90 transition-opacity">
                    {file.type === "image" ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                        <Video className="size-10 text-white/50" />
                      </div>
                    )}

                    {/* Top Action Overlay (Star & Menu) */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className={cn(
                              "size-7 bg-background/80 hover:bg-background backdrop-blur-sm",
                              file.starred && "opacity-100"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarred(file.id);
                            }}
                          >
                            <Star
                              className={cn(
                                "size-3.5",
                                file.starred && "fill-amber-400 text-amber-400"
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {file.starred ? "Remove from favorites" : "Add to favorites"}
                        </TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 bg-background/80 hover:bg-background backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(file.url, "_blank"); }}>
                            <Eye className="mr-2 size-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyToClipboard(file.url); }}>
                            <Copy className="mr-2 size-4" /> Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="mr-2 size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Details Footer */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {file.type === "image" ? (
                        <Image className="size-4 text-primary" />
                      ) : (
                        <Video className="size-4 text-emerald-500" />
                      )}
                      <p className="font-medium text-sm truncate">{file.name}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                      <span>{file.size}</span>
                      <span>{file.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      );
    }

    // List View
    return (
      <TooltipProvider>
        <div className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_120px_100px_80px] gap-4 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
              <span>Name & Preview</span>
              <span>Created</span>
              <span>Size</span>
              <span></span>
            </div>
            <div className="divide-y">
              {filteredItems.map((file) => (
                <div
                  key={file.id}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_100px_80px] gap-2 sm:gap-4 px-4 py-3 hover:bg-accent/50 transition-colors group items-center cursor-pointer"
                  onClick={() => setSelectedMedia(file)}
                >
                  {/* Visual Thumbnail + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {file.type === "image" ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {file.size} · {file.createdAt}
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:block text-sm text-muted-foreground">
                    {file.createdAt}
                  </span>
                  <span className="hidden sm:block text-sm text-muted-foreground">
                    {file.size}
                  </span>

                  <div className="flex items-center gap-1 justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-8 transition-opacity",
                            file.starred
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarred(file.id);
                          }}
                        >
                          <Star
                            className={cn(
                              "size-4",
                              file.starred && "fill-amber-400 text-amber-400"
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {file.starred ? "Remove from starred" : "Add to starred"}
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(file.url, "_blank"); }}>
                          <Eye className="mr-2 size-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyToClipboard(file.url); }}>
                          <Copy className="mr-2 size-4" /> Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="mr-2 size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <>
      {renderContent()}

      <Sheet open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto p-0 border-l flex flex-col gap-0 [&>button]:bg-background/90 [&>button]:backdrop-blur-sm [&>button]:size-8 [&>button]:rounded-full [&>button]:shadow-sm [&>button]:border [&>button]:border-border [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button>svg]:size-4">
          {selectedMedia && (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
              {/* Premium Hero Header */}
              <div className="relative w-full border-b bg-muted/30">
                <div className="aspect-video w-full flex flex-col items-center justify-center p-8">
                  {selectedMedia.type === "image" ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-sm border bg-background/50 flex items-center justify-center">
                      <img src={selectedMedia.url} alt={selectedMedia.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-800 bg-slate-950 flex items-center justify-center group relative">
                      <video src={selectedMedia.url} className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-100" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                        <div className="size-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shadow-lg border border-white/10 text-white">
                          <Video className="size-5 fill-white/20" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Title & Subtitle */}
              <div className="px-4 pt-4 pb-2 min-w-0">
                <SheetHeader className="text-left space-y-1 mb-4 mr-8 min-w-0 p-0 px-2 py-4">
                  <SheetTitle className="text-2xl font-bold tracking-tight truncate">{selectedMedia.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1.5 text-sm">
                    {selectedMedia.type === "image" ? <Image className="size-4" /> : <Video className="size-4" />}
                    <span className="capitalize">{selectedMedia.type}</span>
                    <span>&middot;</span>
                    <span>{selectedMedia.size}</span>
                    <span>&middot;</span>
                    <span>{selectedMedia.createdAt}</span>
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
                <h4 className="text-sm font-semibold tracking-tight text-foreground mb-3">Information</h4>
                <div className="rounded-xl border bg-card/50 text-card-foreground overflow-hidden mb-8">
                  <div className="flex flex-col divide-y divide-border/50">
                    <div className="flex justify-between items-center px-4 py-2 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Favorite</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -mr-2 text-foreground font-medium shrink-0"
                        onClick={() => toggleStarred(selectedMedia.id)}
                      >
                        <Star className={cn("size-3.5 mr-1.5", selectedMedia.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                        {selectedMedia.starred ? "Starred" : "Unstarred"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Direct Link</span>
                      <span className="truncate text-right text-xs font-mono select-all min-w-0 flex-1">{selectedMedia.url}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">File Size</span>
                      <span className="font-medium text-right min-w-0 truncate">{selectedMedia.size}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 text-sm min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Uploaded</span>
                      <span className="font-medium text-right min-w-0 truncate">{selectedMedia.createdAt}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 text-sm bg-muted/20 min-w-0 gap-4">
                      <span className="text-muted-foreground font-medium shrink-0">Internal ID</span>
                      <span className="font-medium text-xs font-mono text-muted-foreground min-w-0 truncate">{selectedMedia.id}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border/50">
                  <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive shadow-none transition-colors">
                    <Trash2 className="mr-2 size-4" /> Move to Trash
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
