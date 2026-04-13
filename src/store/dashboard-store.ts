import { create } from "zustand";
import type { PostStatus } from "@/mock-data/dashboard";

interface DashboardStore {
  commentsSearchQuery: string;
  postsSearchQuery: string;
  postStatusFilter: PostStatus | "all";
  setCommentsSearchQuery: (query: string) => void;
  setPostsSearchQuery: (query: string) => void;
  setPostStatusFilter: (filter: PostStatus | "all") => void;
  clearFilters: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  commentsSearchQuery: "",
  postsSearchQuery: "",
  postStatusFilter: "all",
  setCommentsSearchQuery: (query) => set({ commentsSearchQuery: query }),
  setPostsSearchQuery: (query) => set({ postsSearchQuery: query }),
  setPostStatusFilter: (filter) => set({ postStatusFilter: filter }),
  clearFilters: () =>
    set({
      commentsSearchQuery: "",
      postsSearchQuery: "",
      postStatusFilter: "all",
    }),
}));
