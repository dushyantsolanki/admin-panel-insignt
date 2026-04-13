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
  title: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  date: string;      // "yyyy-MM-dd"
  status: "draft" | "scheduled" | "published";
  author?: string;
}

interface CalendarState {
  currentWeekStart: Date;
  searchQuery: string;
  statusFilter: "all" | "draft" | "scheduled" | "published";
  posts: ScheduledPost[];
  
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

const mockPosts: ScheduledPost[] = [
  {
    id: "1",
    title: "The Future of AI in Web Development",
    startTime: "09:00",
    endTime: "10:00",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "scheduled",
    author: "Admin",
  },
  {
    id: "2",
    title: "Mastering React Server Components",
    startTime: "14:00",
    endTime: "15:30",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    status: "draft",
    author: "John Doe",
  },
];

function getDayOfWeek(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1; // 0 is Monday, 6 is Sunday
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  searchQuery: "",
  statusFilter: "all",
  posts: mockPosts,

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
      id: Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({ posts: [...state.posts, newPost] }));
  },

  getCurrentWeekPosts: () => {
    const state = get();
    const startDate = state.currentWeekStart;
    const endDate = addDays(startDate, 7);
    
    let filteredPosts = state.posts.filter((post) => {
      const postDate = new Date(post.date);
      return postDate >= startDate && postDate < endDate;
    });

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter((post) =>
        post.title.toLowerCase().includes(query)
      );
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
