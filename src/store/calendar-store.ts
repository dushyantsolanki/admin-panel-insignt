import { create } from "zustand";
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  getDay,
} from "date-fns";

export interface ScheduledPost {
  id: string;
  _id?: string;
  title: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  date: string;      // "yyyy-MM-dd"
  status: "draft" | "scheduled" | "published";
  author?: string;
  category?: string;
  slug?: string;
}

interface CalendarState {
  currentWeekStart: Date;
  searchQuery: string;
  statusFilter: "all" | "draft" | "scheduled" | "published";
  posts: ScheduledPost[];
  isLoading: boolean;
  
  fetchPostsFromDB: () => Promise<void>;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: "all" | "draft" | "scheduled" | "published") => void;
  addPost: (post: Omit<ScheduledPost, "id">) => void;
  getCurrentWeekPosts: () => ScheduledPost[];
  getWeekDays: () => Date[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  searchQuery: "",
  statusFilter: "all",
  posts: [],
  isLoading: true,

  fetchPostsFromDB: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/posts?limit=500");
      const json = await res.json();
      if (json.posts && Array.isArray(json.posts)) {
        const mappedPosts: ScheduledPost[] = json.posts.map((p: any) => {
          const rawDate = p.createdAt || p.publishedAt || p.date || new Date().toISOString();
          const d = new Date(rawDate);
          const validDate = isNaN(d.getTime()) ? new Date() : d;
          const dateStr = format(validDate, "yyyy-MM-dd");
          const startTimeStr = format(validDate, "HH:mm");
          const endD = new Date(validDate.getTime() + 60 * 60 * 1000);
          const endTimeStr = format(endD, "HH:mm");

          return {
            id: p._id || p.id,
            _id: p._id || p.id,
            title: p.title || "Untitled Post",
            startTime: startTimeStr,
            endTime: endTimeStr,
            date: dateStr,
            status: (p.status === "published" || p.status === "scheduled" || p.status === "draft") ? p.status : "published",
            author: typeof p.author === "object" ? p.author?.name || "Admin" : "Admin",
            category: typeof p.category === "object" ? p.category?.name || "General" : "General",
            slug: p.slug || "",
          };
        });

        set({ posts: mappedPosts, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Failed fetching calendar posts from DB:", err);
      set({ isLoading: false });
    }
  },

  goToNextWeek: () =>
    set((state) => ({
      currentWeekStart: addWeeks(state.currentWeekStart, 1),
    })),

  goToPreviousWeek: () =>
    set((state) => ({
      currentWeekStart: subWeeks(state.currentWeekStart, 1),
    })),

  goToToday: () =>
    set({
      currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
    }),

  goToDate: (date: Date) =>
    set({
      currentWeekStart: startOfWeek(date, { weekStartsOn: 1 }),
    }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),

  addPost: (postData) => {
    const newPost: ScheduledPost = {
      ...postData,
      id: postData._id || Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({ posts: [...state.posts, newPost] }));
  },

  getCurrentWeekPosts: () => {
    const state = get();
    const startDate = state.currentWeekStart;
    const endDate = addDays(startDate, 7);
    
    let filteredPosts = state.posts.filter((post) => {
      const postDate = new Date(post.date + "T00:00:00");
      return postDate >= startDate && postDate < endDate;
    });

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter((post) => {
        const inTitle = (post.title || "").toLowerCase().includes(query);
        const inAuthor = (post.author || "").toLowerCase().includes(query);
        const inCategory = (post.category || "").toLowerCase().includes(query);
        const inStatus = (post.status || "").toLowerCase().includes(query);
        return inTitle || inAuthor || inCategory || inStatus;
      });
    }

    if (state.statusFilter !== "all") {
      filteredPosts = filteredPosts.filter(
        (post) => post.status === state.statusFilter
      );
    }

    return filteredPosts;
  },

  getWeekDays: () => {
    const state = get();
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(state.currentWeekStart, i));
    }
    return days;
  },
}));
