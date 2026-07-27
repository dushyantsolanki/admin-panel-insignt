"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Check, Image as ImageIcon, Video, Music, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface MediaItem {
  _id: string;
  name: string;
  type: "image" | "video" | "audio";
  url: string;
  size?: string;
}

interface MediaSelectComboboxProps {
  type: "image" | "video" | "audio";
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

function MediaThumbnail({ item }: { item: MediaItem }) {
  const [imageError, setImageError] = useState(false);

  if (item.type === "image" && !imageError) {
    return (
      <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
        <img
          src={item.url}
          alt={item.name}
          onError={() => setImageError(true)}
          className="size-full object-cover"
        />
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <div className="size-10 rounded-md bg-purple-950/20 text-purple-500 overflow-hidden shrink-0 border border-purple-500/20 flex items-center justify-center">
        <Video className="size-5" />
      </div>
    );
  }

  if (item.type === "audio") {
    return (
      <div className="size-10 rounded-md bg-emerald-950/20 text-emerald-500 overflow-hidden shrink-0 border border-emerald-500/20 flex items-center justify-center">
        <Music className="size-5" />
      </div>
    );
  }

  return (
    <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
      <ImageIcon className="size-4 text-muted-foreground" />
    </div>
  );
}

export function MediaSelectCombobox({
  type,
  value,
  onChange,
  placeholder = "Select media from library...",
}: MediaSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch media from API with pagination
  const fetchMedia = useCallback(async (pageNum: number, searchQuery: string, isAppend = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        type,
        search: searchQuery,
      });

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();

      const newMedia: MediaItem[] = data.media || [];
      const totalPages = data.pagination?.totalPages || 1;

      if (isAppend) {
        setMediaList((prev) => [...prev, ...newMedia]);
      } else {
        setMediaList(newMedia);
      }

      setHasMore(pageNum < totalPages);
    } catch (err) {
      console.error("Failed loading media for select:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [type]);

  // Sync selectedMedia item when value prop changes or on initial fetch
  useEffect(() => {
    if (value) {
      const found = mediaList.find((m) => m.url === value);
      if (found) {
        setSelectedMedia(found);
      } else {
        // Fallback display if URL is custom or not in loaded page
        setSelectedMedia({
          _id: "custom",
          name: value.split("/").pop() || value,
          type,
          url: value,
        });
      }
    } else {
      setSelectedMedia(null);
    }
  }, [value, mediaList, type]);

  // Load when popover opens or search changes
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchMedia(1, debouncedSearch, false);
    }
  }, [open, debouncedSearch, fetchMedia]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      target.scrollTop + target.clientHeight >= target.scrollHeight - 30 &&
      hasMore &&
      !isLoadingMore &&
      !isLoading
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMedia(nextPage, debouncedSearch, true);
    }
  };

  const getMediaIcon = () => {
    if (type === "video") return <Video className="size-4 text-purple-500" />;
    if (type === "audio") return <Music className="size-4 text-emerald-500" />;
    return <ImageIcon className="size-4 text-primary" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full max-w-full min-w-0 justify-between h-auto py-2 px-3 text-left font-normal border-border/60 bg-muted/20 hover:bg-muted/30 transition-all overflow-hidden"
        >
          {selectedMedia ? (
            <div className="flex items-center justify-between w-full min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                <MediaThumbnail item={selectedMedia} />
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {selectedMedia.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate font-mono">
                    {selectedMedia.size || selectedMedia.url}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                  setSelectedMedia(null);
                }}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground shrink-0 ml-2"
                title="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-2 min-w-0 truncate">
              {getMediaIcon()}
              <span className="truncate min-w-0">{placeholder}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[90vw] p-0 border-border shadow-2xl overflow-hidden"
        align="start"
      >
        {/* Search Input Header */}
        <div className="p-2 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder={`Search ${type} library by filename...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background border-border/60"
            />
          </div>
        </div>

        {/* Media List with Infinite Scroll */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[260px] overflow-y-auto p-1 divide-y divide-border/30"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading {type} files...</span>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No {type} files found in Media Library.
            </div>
          ) : (
            <>
              {mediaList.map((item) => {
                const isSelected = value === item.url;

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      onChange(item.url);
                      setSelectedMedia(item);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/60 transition-all",
                      isSelected && "bg-primary/10 hover:bg-primary/15"
                    )}
                  >
                    <MediaThumbnail item={item} />

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <h5 className="text-xs font-semibold text-foreground truncate">
                        {item.name}
                      </h5>
                      <span className="text-[10px] text-muted-foreground font-mono truncate">
                        {item.size ? `${item.size} • ` : ""}{item.url}
                      </span>
                    </div>

                    {isSelected && <Check className="size-4 text-primary shrink-0 mr-1" />}
                  </div>
                );
              })}

              {isLoadingMore && (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Loading more...</span>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
