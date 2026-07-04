"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Eye,
  Clock,
  ArrowUpRight,
  Award,
  TrendingUp,
  Flame,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface PopularPost {
  id: string;
  title: string;
  slug: string;
  views: number;
  avgTime: string;
  completionRate: number;
  category: string;
  author: string;
}

export function AnalyticsHighlight() {
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.popularPosts) {
          setPopularPosts(json.popularPosts.posts || json.popularPosts);
        }
      } catch (error) {
        console.error("Error fetching popular posts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
          <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-5 bg-muted rounded w-16 animate-pulse" />
        </div>
        <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                </div>
                <div className="h-4 bg-muted rounded w-12 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topPost = popularPosts[0];
  const remainingPosts = popularPosts.slice(1);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <Sparkles className="size-4 text-primary animate-pulse" />
          Analytics Highlights
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold bg-muted/50 px-2 py-1 rounded">
          Top Content
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-y-auto no-scrollbar max-h-[460px]">
        {popularPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <Flame className="size-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-sm text-foreground">No traffic data recorded</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
              Publish posts and track visitors to see your top content highlights.
            </p>
          </div>
        ) : (
          <>
            {/* Top Performer Card (Spotlight) */}
            {topPost && (
              <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-4 mb-4 group transition-all duration-300 hover:shadow-md hover:border-primary/40">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Award className="size-16 text-primary" />
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                  <Flame className="size-3.5 fill-primary text-orange-400 " />
                  Top Overall Performer
                </div>

                <h4 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                  {topPost.title}
                </h4>

                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  by {topPost.author} • <span className="italic">{topPost.category}</span>
                </p>

                {/* Spotlight metrics row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-card/50 border rounded-lg p-2 flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Eye className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase leading-none">Views</p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5">{topPost.views.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-card/50 border rounded-lg p-2 flex items-center gap-2">
                    <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase leading-none">Avg Time</p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5">{topPost.avgTime}</p>
                    </div>
                  </div>
                </div>



                <div className="mt-3 flex justify-end">
                  <NextLink
                    href={`https://modern-blog-nine-virid.vercel.app/blog/${topPost.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    View Post <ArrowUpRight className="size-3" />
                  </NextLink>
                </div>
              </div>
            )}

            {/* Other Popular Content List */}
            {remainingPosts.length > 0 && (
              <div className="space-y-3 flex-1">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Top Performing Contenders
                </h5>

                <div className="divide-y divide-border/50">
                  {remainingPosts?.slice(0, 2)?.map((post, index) => (
                    <div
                      key={post.id}
                      className="py-2.5 flex items-center justify-between gap-4 group/item hover:bg-muted/10 px-1 rounded-md transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground/60 w-5 text-center mt-0.5">
                          #{index + 2}
                        </span>
                        <div className="min-w-0">
                          <h6 className="text-xs font-semibold text-foreground truncate group-hover/item:text-primary transition-colors">
                            {post.title}
                          </h6>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <span>{post.category}</span>
                            <span>•</span>
                            <span className="truncate">by {post.author}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0">
                        {/* Views & Read percentage */}
                        <div className="text-right">
                          <p className="text-xs font-bold text-foreground tabular-nums flex items-center justify-end gap-1">
                            <Eye className="size-3 text-muted-foreground/60" />
                            {post.views.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                            {post.avgTime}
                          </p>
                        </div>

                        <NextLink
                          href={`https://modern-blog-nine-virid.vercel.app/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-7 rounded-md border flex items-center justify-center hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all opacity-0 group-hover/item:opacity-100"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </NextLink>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
