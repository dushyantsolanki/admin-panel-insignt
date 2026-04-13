export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  size: string;
  createdAt: string;
  starred: boolean;
}

export const mediaData: MediaItem[] = [
  {
    id: "m1",
    name: "Hero Cover Illustration",
    type: "image",
    url: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3",
    size: "2.4 MB",
    createdAt: "Dec 15, 2024",
    starred: true,
  },
  {
    id: "m2",
    name: "Product Walkthrough",
    type: "video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    size: "45 MB",
    createdAt: "Dec 10, 2024",
    starred: true,
  },
  {
    id: "m3",
    name: "Team Brainstorming Session",
    type: "image",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2850&ixlib=rb-4.0.3",
    size: "1.8 MB",
    createdAt: "Dec 08, 2024",
    starred: false,
  },
  {
    id: "m4",
    name: "Next.js Conf Highlights",
    type: "video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    size: "128 MB",
    createdAt: "Dec 05, 2024",
    starred: false,
  },
  {
    id: "m5",
    name: "Logo Dark Mode transparent",
    type: "image",
    url: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3",
    size: "450 KB",
    createdAt: "Dec 01, 2024",
    starred: true,
  },
];

export const mediaStorageStat = {
  used: 2.1,
  total: 5.0, // Limit for CMS media
  breakdown: [
    { type: "Images", size: 0.8, color: "#8B5CF6" },
    { type: "Videos", size: 1.3, color: "#EC4899" },
  ],
};
