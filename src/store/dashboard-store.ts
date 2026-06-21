import { create } from "zustand";
import type { PostStatus } from "@/mock-data/dashboard";

interface DashboardStore {
  postsSearchQuery: string;
  postStatusFilter: PostStatus | "all";
  setPostsSearchQuery: (query: string) => void;
  setPostStatusFilter: (filter: PostStatus | "all") => void;
  clearFilters: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  postsSearchQuery: "",
  postStatusFilter: "all",
  setPostsSearchQuery: (query) => set({ postsSearchQuery: query }),
  setPostStatusFilter: (filter) => set({ postStatusFilter: filter }),
  clearFilters: () =>
    set({
      postsSearchQuery: "",
      postStatusFilter: "all",
    }),
}));
