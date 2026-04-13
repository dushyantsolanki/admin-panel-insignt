export type PostStatus = "published" | "draft" | "scheduled";

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    avatarSeed: string;
  };
  image: string;
  videoUrl?: string;
  status: PostStatus;
  views: number;
  
  // SEO Specific Fields
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  canonicalUrl?: string;
  focusKeyword?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  robotsMeta?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCreator?: string;
  lang?: string;
  breadcrumbTitle?: string;
}

export const posts: Post[] = [
  {
    id: "p1",
    slug: "future-of-ai-in-creative-work",
    title: "The Future of AI in Creative Work",
    excerpt: "Artificial intelligence is reshaping how we approach design, writing, and art. Here's a practical look at what's changing.",
    category: "Technology",
    date: "Mar 28, 2026",
    readTime: "8 min read",
    author: { name: "Sarah Chen", avatarSeed: "sarah" },
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400&auto=format&fit=crop",
    status: "published",
    views: 1240,
    seoTitle: "Future of AI in Creativity | 2026 Guide",
    seoDescription: "Explore how AI is transforming the creative industry in 2026. Insights from Sarah Chen on AI collaboration.",
    keywords: ["AI", "Creativity", "Future of Work", "Sarah Chen"],
  },
  {
    id: "p2",
    slug: "productivity-frameworks-2026",
    title: "10 Productivity Frameworks That Actually Work in 2026",
    excerpt: "Forget hustle culture. These evidence-based methods genuinely help you do meaningful work.",
    category: "Productivity",
    date: "Mar 25, 2026",
    readTime: "6 min read",
    author: { name: "Marcus Lee", avatarSeed: "marcus" },
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=400&auto=format&fit=crop",
    status: "published",
    views: 850,
    seoTitle: "10 Best Productivity Frameworks for 2026",
    seoDescription: "Evidence-based productivity methods to help you work smarter and avoid burnout in 2026.",
    keywords: ["Productivity", "Frameworks", "Efficiency", "Work Smarter"],
  },
  {
    id: "p3",
    slug: "art-of-creative-constraints",
    title: "The Art of Creative Constraints: Less is More",
    excerpt: "How embracing limitations can unlock your most innovative work. Lessons from artists and engineers.",
    category: "Design",
    date: "Apr 02, 2026",
    readTime: "7 min read",
    author: { name: "Alex Rivera", avatarSeed: "alex" },
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=400&auto=format&fit=crop",
    status: "scheduled",
    views: 0,
    seoTitle: "Unlocking Innovation Through Creative Constraints",
    seoDescription: "Learn how limitations can fuel creativity and innovation with Alex Rivera's design insights.",
    keywords: ["Design", "Innovation", "Creative Thinking", "Constraints"],
  },
  {
    id: "p4",
    slug: "minimalist-design-systems",
    title: "Designing Minimalist Systems for Scale",
    excerpt: "Breaking down the philosophy behind some of the world's most successful minimalist design systems.",
    category: "Design",
    date: "Apr 05, 2026",
    readTime: "10 min read",
    author: { name: "Sarah Chen", avatarSeed: "sarah" },
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=400&auto=format&fit=crop",
    status: "draft",
    views: 0,
    seoTitle: "Minimalist Design Systems: A Guide to Scalability",
    seoDescription: "How to build and scale minimalist design systems. Lessons in simplicity and functional design.",
    keywords: ["Design Systems", "Minimalism", "Scalability", "UI/UX"],
  },
  {
    id: "p5",
    slug: "sustainable-tech-trends",
    title: "Sustainable Tech Trends to Watch in 2026",
    excerpt: "From green hosting to hardware recycling, see how technology is becoming more environmentally friendly.",
    category: "Technology",
    date: "Feb 15, 2026",
    readTime: "5 min read",
    author: { name: "Priya Sharma", avatarSeed: "priya" },
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=400&auto=format&fit=crop",
    status: "published",
    views: 2100,
    seoTitle: "Top Sustainable Technology Trends 2026",
    seoDescription: "Discover the most important sustainability trends in the tech world this year.",
    keywords: ["Green Tech", "Sustainability", "Trends", "2026"],
  },
];
