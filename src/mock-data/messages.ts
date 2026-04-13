export type MessageStatus = "unread" | "read" | "replied";

export interface Message {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  content: string;
  status: MessageStatus;
  receivedDate: string;
  senderAvatarSeed: string;
}

export const messages: Message[] = [
  {
    id: "m1",
    senderName: "Dushyant Solanki",
    senderEmail: "dushyant@example.com",
    subject: "Feedback on the new design",
    content: "The new Apple-inspired design looks absolutely stunning! Great work.",
    status: "unread",
    receivedDate: "08 Apr 2026",
    senderAvatarSeed: "dushyant",
  },
  {
    id: "m2",
    senderName: "Alice Freeman",
    senderEmail: "alice@example.com",
    subject: "Partnership Opportunity",
    content: "We'd love to discuss a potential partnership with your blog.",
    status: "read",
    receivedDate: "07 Apr 2026",
    senderAvatarSeed: "alice",
  },
  {
    id: "m3",
    senderName: "Bob Smith",
    senderEmail: "bob@example.com",
    subject: "Question about latest post",
    content: "I had a question regarding the implementation of the reading progress bar.",
    status: "replied",
    receivedDate: "06 Apr 2026",
    senderAvatarSeed: "bob",
  },
  {
    id: "m4",
    senderName: "Charlie Brown",
    senderEmail: "charlie@example.com",
    subject: "Guest Listing Enquiry",
    content: "Hi, do you accept guest posts on your blog? I have some great ideas.",
    status: "unread",
    receivedDate: "05 Apr 2026",
    senderAvatarSeed: "charlie",
  },
  {
    id: "m5",
    senderName: "Diana Prince",
    senderEmail: "diana@example.com",
    subject: "Site Performance Issue",
    content: "I noticed a slight delay when loading the media gallery on mobile.",
    status: "read",
    receivedDate: "04 Apr 2026",
    senderAvatarSeed: "diana",
  },
  {
    id: "m6",
    senderName: "Ethan Hunt",
    senderEmail: "ethan@example.com",
    subject: "Security Update",
    content: "Just a heads up, there's a new version of the dashboard framework out.",
    status: "unread",
    receivedDate: "03 Apr 2026",
    senderAvatarSeed: "ethan",
  },
  {
    id: "m7",
    senderName: "Fiona Gallagher",
    senderEmail: "fiona@example.com",
    subject: "Beautiful Layout!",
    content: "Just wanted to say keep up the great work. The UX is top-notch.",
    status: "replied",
    receivedDate: "02 Apr 2026",
    senderAvatarSeed: "fiona",
  },
  {
    id: "m8",
    senderName: "George Costanza",
    senderEmail: "george@example.com",
    subject: "Late Night Thoughts",
    content: "Have you ever thought about adding a dark mode toggle specifically for articles?",
    status: "read",
    receivedDate: "01 Apr 2026",
    senderAvatarSeed: "george",
  },
  {
    id: "m9",
    senderName: "Hannah Abbott",
    senderEmail: "hannah@example.com",
    subject: "Typography Suggestion",
    content: "I think the Inter font choice for code blocks is excellent.",
    status: "unread",
    receivedDate: "31 Mar 2026",
    senderAvatarSeed: "hannah",
  },
  {
    id: "m10",
    senderName: "Ian Wright",
    senderEmail: "ian@example.com",
    subject: "Collaboration ?",
    content: "Would love to feature your blog in our monthly newsletter.",
    status: "unread",
    receivedDate: "30 Mar 2026",
    senderAvatarSeed: "ian",
  },
];
