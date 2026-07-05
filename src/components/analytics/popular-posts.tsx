"use client";

import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Search, Loader2, FileText, ArrowUpRight } from "lucide-react";
import NextLink from "next/link";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";

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

export function PopularPosts() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [isPopularLoading, setIsPopularLoading] = useState(false);
  const [popularPage, setPopularPage] = useState(1);
  const [popularLimit, setPopularLimit] = useState(5);
  const [popularSearch, setPopularSearch] = useState("");
  const [popularTotal, setPopularTotal] = useState(0);
  const [popularPages, setPopularPages] = useState(1);
  
  const debouncedPopularSearch = useDebounce(popularSearch, 500);

  useEffect(() => {
    async function fetchPopularPosts() {
      setIsPopularLoading(true);
      try {
        const params = new URLSearchParams({
          popularPage: popularPage.toString(),
          popularLimit: popularLimit.toString(),
          popularSearch: debouncedPopularSearch,
        });
        if (date?.from) params.set("startDate", date.from.toISOString());
        if (date?.to) params.set("endDate", date.to.toISOString());

        const res = await fetch(`/api/analytics/popular?${params.toString()}`);
        const json = await res.json();
        if (json.popularPosts) {
          setPopularPosts(json.popularPosts.posts);
          setPopularTotal(json.popularPosts.pagination.total);
          setPopularPages(json.popularPosts.pagination.pages);
          if (json.popularPosts.pagination.pages > 0 && popularPage > json.popularPosts.pagination.pages) {
            setPopularPage(json.popularPosts.pagination.pages);
          }
        }
      } catch (error) {
        console.error("Error fetching popular posts:", error);
      } finally {
        setIsPopularLoading(false);
      }
    }
    fetchPopularPosts();
  }, [date, popularPage, popularLimit, debouncedPopularSearch]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b bg-muted/20 gap-3">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          Top Performing Pages
        </h3>
        <DateRangePicker date={date} setDate={setDate} />
      </div>

      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isPopularLoading && popularSearch ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <input
            type="text"
            placeholder="Search by title or slug..."
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-background text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            value={popularSearch}
            onChange={(e) => {
              setPopularSearch(e.target.value);
              setPopularPage(1);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/30 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Page Details</th>
              <th className="px-6 py-4 font-semibold">Views</th>
              <th className="px-6 py-4 font-semibold">Avg. Time</th>
              <th className="px-6 py-4 font-semibold">Completion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isPopularLoading && popularPosts.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-3/4 mb-2"></div><div className="h-3 bg-muted rounded w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-3/4"></div></td>
                </tr>
              ))
            ) : popularPosts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No pages found for this period.
                </td>
              </tr>
            ) : (
              popularPosts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      {post.title}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{post.category}</span>
                      <span>/{post.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{post.views.toLocaleString()}</td>
                  <td className="px-6 py-4">{post.avgTime}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8">{post.completionRate}%</span>
                      <div className="w-full max-w-[100px] bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${post.completionRate}%` }}
                        ></div>
                      </div>
                      <NextLink href={`/dashboard/posts/edit/${post.id}`} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </NextLink>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {popularPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(popularPage - 1) * popularLimit + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(popularPage * popularLimit, popularTotal)}</span> of{" "}
            <span className="font-medium text-foreground">{popularTotal}</span> entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={popularPage === 1}
              onClick={() => setPopularPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={popularPage === popularPages}
              onClick={() => setPopularPage((p) => Math.min(popularPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
