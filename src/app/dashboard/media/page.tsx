"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LayoutGrid, List, ArrowLeft } from "lucide-react";
import { MediaStorageCards } from "@/components/dashboard/media-storage-cards";
import { MediaList } from "@/components/dashboard/media-list";
import type { MediaType } from "@/mock-data/media";

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<MediaType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filterLabel = activeFilter === "image" ? "Images" : activeFilter === "video" ? "Videos" : "All Media";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto h-full overflow-y-auto">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your blog images and video links directly.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${filterLabel.toLowerCase()}...`}
              className="w-full bg-background pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="mr-2 size-4" /> Add Link
          </Button>
        </div>
      </div>

      {/* Storage Cards — shown only when no filter is active */}
      {!activeFilter && (
        <div className="flex-none">
          <MediaStorageCards onFilterSelect={(type) => setActiveFilter(type)} />
        </div>
      )}

      {/* Section heading with back button when filtered */}
      <div className="flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          {activeFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => {
                setActiveFilter(null);
                setSearchQuery("");
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <h2 className="text-lg font-semibold tracking-tight">{filterLabel}</h2>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="px-2.5 shadow-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="px-2.5 shadow-none"
            onClick={() => setViewMode("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Media Content */}
      <div className="flex-1 min-h-0">
        <MediaList viewMode={viewMode} filterType={activeFilter} searchQuery={searchQuery} />
      </div>
    </div>
  );
}
