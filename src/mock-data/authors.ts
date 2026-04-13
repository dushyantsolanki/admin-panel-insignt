export type AuthorRole = "admin" | "editor" | "contributor";
export type AuthorStatus = "active" | "inactive";

export interface Author {
  id: string;
  name: string;
  email: string;
  role: AuthorRole;
  totalPosts: number;
  status: AuthorStatus;
  joinDate: string;
  avatarSeed: string;
}

export const authors: Author[] = [
  {
    id: "a1",
    name: "Dushyant Solanki",
    email: "dushyant@example.com",
    role: "admin",
    totalPosts: 45,
    status: "active",
    joinDate: "12 Jan 2024",
    avatarSeed: "dushyant",
  },
  {
    id: "a2",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    role: "editor",
    totalPosts: 32,
    status: "active",
    joinDate: "15 Feb 2024",
    avatarSeed: "sarah",
  },
  {
    id: "a3",
    name: "Michael Chen",
    email: "m.chen@example.com",
    role: "contributor",
    totalPosts: 12,
    status: "active",
    joinDate: "02 Mar 2024",
    avatarSeed: "michael",
  },
  {
    id: "a4",
    name: "Emily Rodriguez",
    email: "emily.r@example.com",
    role: "editor",
    totalPosts: 28,
    status: "inactive",
    joinDate: "20 Dec 2023",
    avatarSeed: "emily",
  },
  {
    id: "a5",
    name: "James Wilson",
    email: "j.wilson@example.com",
    role: "contributor",
    totalPosts: 8,
    status: "active",
    joinDate: "10 Apr 2024",
    avatarSeed: "james",
  },
  {
    id: "a6",
    name: "Olivia Thompson",
    email: "olivia.t@example.com",
    role: "contributor",
    totalPosts: 15,
    status: "active",
    joinDate: "22 Jan 2024",
    avatarSeed: "olivia",
  },
  {
    id: "a7",
    name: "Robert Taylor",
    email: "r.taylor@example.com",
    role: "editor",
    totalPosts: 21,
    status: "active",
    joinDate: "05 Nov 2023",
    avatarSeed: "robert",
  },
  {
    id: "a8",
    name: "Jessica White",
    email: "jessica.w@example.com",
    role: "contributor",
    totalPosts: 5,
    status: "inactive",
    joinDate: "18 Mar 2024",
    avatarSeed: "jessica",
  },
  {
    id: "a9",
    name: "David Miller",
    email: "d.miller@example.com",
    role: "admin",
    totalPosts: 18,
    status: "active",
    joinDate: "30 Sep 2023",
    avatarSeed: "david",
  },
  {
    id: "a10",
    name: "Sophia Garcia",
    email: "sophia.g@example.com",
    role: "editor",
    totalPosts: 40,
    status: "active",
    joinDate: "14 Oct 2023",
    avatarSeed: "sophia",
  },
];
