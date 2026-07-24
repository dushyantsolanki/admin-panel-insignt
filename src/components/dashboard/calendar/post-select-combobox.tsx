"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Check, FileText, Image as ImageIcon, Tag } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export interface DBPostItem {
  _id: string;
  title: string;
  slug: string;
  status: string;
  image?: string;
  featuredImage?: string;
  imageUrl?: string;
  category?: { name: string; color?: string } | string;
  author?: { name: string } | string;
}

interface PostSelectComboboxProps {
  selectedPost: DBPostItem | null;
  onSelectPost: (post: DBPostItem) => void;
}

function PostImageItem({ src, title }: { src?: string | null; title: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
        <ImageIcon className="size-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="size-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
      <img
        src={src}
        alt={title}
        onError={() => setImageError(true)}
        className="size-full object-cover"
      />
    </div>
  );
}

export function PostSelectCombobox({ selectedPost, onSelectPost }: PostSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<DBPostItem[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch posts from API with pagination
  const fetchPosts = useCallback(async (pageNum: number, searchQuery: string, isAppend = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
        search: searchQuery,
      });

      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();

      const newPosts: DBPostItem[] = data.posts || [];
      const totalPages = data.pagination?.totalPages || 1;

      if (isAppend) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(pageNum < totalPages);
    } catch (err) {
      console.error("Failed loading posts for select:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load or search query change
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchPosts(1, debouncedSearch, false);
    }
  }, [open, debouncedSearch, fetchPosts]);

  // Infinite scroll handler
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
      fetchPosts(nextPage, debouncedSearch, true);
    }
  };

  const getCategoryName = (category: any) => {
    if (!category) return "General";
    if (typeof category === "object") return category.name || "General";
    return category;
  };

  const getPostImage = (post: DBPostItem) => {
    return (
      post.image ||
      post.featuredImage ||
      post.imageUrl ||
      (post as any).seo?.ogImage ||
      null
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2.5 px-3 text-left font-normal border-border/60 bg-muted/20 hover:bg-muted/30"
        >
          {selectedPost ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <PostImageItem src={getPostImage(selectedPost)} title={selectedPost.title} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground truncate">
                  {selectedPost.title}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Tag className="size-3 text-primary shrink-0" />
                  {getCategoryName(selectedPost.category)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Select a post from database to schedule...
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] sm:w-[460px] p-0 border-border shadow-2xl" align="start">
        {/* Search Header */}
        <div className="p-2 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search database posts by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background border-border/60"
            />
          </div>
        </div>

        {/* Infinite Scroll Post List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[260px] overflow-y-auto p-1 divide-y divide-border/30"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading database posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No database posts found.
            </div>
          ) : (
            <>
              {posts.map((post) => {
                const isSelected = selectedPost?._id === post._id;
                const img = getPostImage(post);
                const categoryName = getCategoryName(post.category);

                return (
                  <div
                    key={post._id}
                    onClick={() => {
                      onSelectPost(post);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/60 transition-all",
                      isSelected && "bg-primary/10 hover:bg-primary/15"
                    )}
                  >
                    {/* Featured Image */}
                    <PostImageItem src={img} title={post.title} />

                    {/* Post Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <h5 className="text-xs font-semibold text-foreground truncate">
                        {post.title}
                      </h5>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Tag className="size-2.5 text-primary" />
                          {categoryName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] h-3.5 px-1 uppercase tracking-wider font-bold border-0",
                            post.status === "draft" && "bg-slate-100 text-slate-600 dark:bg-slate-900",
                            post.status === "scheduled" && "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
                            post.status === "published" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
                          )}
                        >
                          {post.status}
                        </Badge>
                      </div>
                    </div>

                    {isSelected && <Check className="size-4 text-primary shrink-0 mr-1" />}
                  </div>
                );
              })}

              {/* Infinite Scroll Loader */}
              {isLoadingMore && (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Loading more posts...</span>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
