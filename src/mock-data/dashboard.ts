export const dashboardStats = {
  totalPosts: { value: 84, change: 12 },
  monthlyViews: { value: "128.4K", change: 5 },
  avgReadTime: { value: "4:32m", change: 8 },
  totalReaders: { value: "15.2K", change: 15 },
};

export const performanceScore = 86;
export const performanceChange = 15;

export const performanceChartData = [
  { day: "Mon", value: 78 },
  { day: "Tue", value: 82 },
  { day: "Wed", value: 92 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 88 },
  { day: "Sat", value: 80 },
].map((d, i, arr) => {
  const isMax = d.value === Math.max(...arr.map((x) => x.value));
  return { ...d, isHighlight: isMax };
});

export type PostStatus = "published" | "draft" | "scheduled";

export interface RecentComment {
  id: string;
  authorName: string;
  postTitle: string;
  snippet: string;
  date: string;
}

export interface Post {
  id: string;
  title: string;
  author: string;
  status: PostStatus;
  views: number;
  category: string;
  date: string;
  authorAvatarSeed: string;
  image: string;
  slug: string;
}

export const recentComments: RecentComment[] = [
  {
    id: "1",
    authorName: "Sarah J.",
    postTitle: "The Future of AI",
    snippet: "This is a great insight into how LLMs are evolving...",
    date: "2 hours ago",
  },
  {
    id: "2",
    authorName: "Mike R.",
    postTitle: "Clean Code Tips",
    snippet: "I disagree with point #3, but overall very helpful.",
    date: "5 hours ago",
  },
  {
    id: "3",
    authorName: "Elena K.",
    postTitle: "Modern CSS",
    snippet: "Container queries are finally here! Great post.",
    date: "1 day ago",
  },
  {
    id: "4",
    authorName: "Alex M.",
    postTitle: "The Future of AI",
    snippet: "When is the next part coming out?",
    date: "1 day ago",
  },
];

const postSeeds: Omit<Post, "id">[] = [
  {
    title: "The Future of AI",
    author: "Michael M.",
    status: "published",
    views: 1240,
    category: "Technology",
    date: "12 Mar 2024",
    authorAvatarSeed: "michael",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YWl8ZW58MHx8MHx8fDA%3D",
    slug: "the-future-of-ai"
  },
  {
    title: "Clean Code Tips",
    author: "Sarah K.",
    status: "published",
    views: 850,
    category: "Development",
    date: "10 Mar 2024",
    authorAvatarSeed: "sarah",
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29kZXxlbnwwfHwwfHx8MA%3D%3D",
    slug: "clean-code-tips"
  },
  {
    title: "Modern CSS Guide",
    author: "James L.",
    status: "draft",
    views: 0,
    category: "Design",
    date: "20 Mar 2024",
    authorAvatarSeed: "james",
    image: "https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3NzfGVufDB8fDB8fHww",
    slug: "modern-css-guide"
  },
  {
    title: "Market Trends 2024",
    author: "Emily R.",
    status: "scheduled",
    views: 0,
    category: "Business",
    date: "25 Mar 2024",
    authorAvatarSeed: "emily",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YnVzaW5lc3N8ZW58MHx8MHx8fDA%3D",
    slug: "market-trends-2024"
  },
  {
    title: "Productivity Hacks",
    author: "David T.",
    status: "published",
    views: 2100,
    category: "Lifestyle",
    date: "18 Mar 2024",
    authorAvatarSeed: "david",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZHVjdGl2aXR5fGVufDB8fDB8fHww",
    slug: "productivity-hacks"
  },
  {
    title: "Vibe Coding 101",
    author: "Alex P.",
    status: "published",
    views: 1560,
    category: "Technology",
    date: "22 Mar 2024",
    authorAvatarSeed: "alex",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y3liZXJwdW5rfGVufDB8fDB8fHww",
    slug: "vibe-coding-101"
  },
  {
    title: "Next.js 15 Features",
    author: "Jordan L.",
    status: "draft",
    views: 0,
    category: "Development",
    date: "08 Mar 2024",
    authorAvatarSeed: "jordan",
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmV4dGpzfGVufDB8fDB8fHww",
    slug: "nextjs-15-features"
  },
  {
    title: "UI/UX Best Practices",
    author: "Sam R.",
    status: "published",
    views: 920,
    category: "Design",
    date: "15 Mar 2024",
    authorAvatarSeed: "sam",
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXglMjBkZXNpZ258ZW58MHx8MHx8fDA%3D",
    slug: "ui-ux-best-practices"
  },
];

export const posts: Post[] = postSeeds.map((p, i) => ({ ...p, id: `post-${i + 1}` }));

export const welcomeSummary = {
  userName: "Dushyant",
  tasksDueToday: 4,
  overdueTasks: 2,
  upcomingDeadlines: 8,
};

export const lastUpdated = "12 May 2025";
