import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";
import AnalyticsEvent from "@/models/analytics";
import Author from "@/models/author";
import Subscriber from "@/models/subscriber";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Fetch Stats
    // Readers: Number of active subscribers
    const readersCount = await Subscriber.countDocuments({ status: 'active' });
    
    // Stories: Number of published posts
    const storiesCount = await Post.countDocuments({ status: 'published' });
    
    // Views: Number of total page views from AnalyticsEvent
    const viewsCount = await AnalyticsEvent.countDocuments();
    
    // Minds: Number of active authors
    const mindsCount = await Author.countDocuments({ status: 'active' });

    // Format stats with K/M for large numbers
    const formatStat = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
      if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
      return num.toString();
    };

    const stats = [
      { label: "Readers", value: formatStat(readersCount), sub: "Monthly Subscribers" },
      { label: "Stories", value: storiesCount.toString() + "+", sub: "Expert Articles" },
      { label: "Views", value: formatStat(viewsCount), sub: "Annual Engagement" },
      { label: "Minds", value: mindsCount.toString() + "+", sub: "Global Contributors" },
    ];

    // 2. Fetch Team
    const authors = await Author.find({ status: 'active' }).select('name role bio avatar gradient');
    const team = authors.map(author => ({
      name: author.name,
      role: author.role,
      bio: author.bio,
      avatar: author.avatar || "",
      accent: author.gradient || "bg-blue-500/10",
    }));

    // 3. Static Values for now
    const values = [
      {
        title: "Craft Over Speed",
        description: "Every piece is researched and edited to meet a high bar of excellence, prioritizing depth over volume.",
        icon: "Sparkles",
        className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-500/5 to-transparent",
      },
      {
        title: "Reader First",
        description: "No pop-ups or dark patterns. We respect your attention above all else.",
        icon: "Users",
        className: "md:col-span-1 md:row-span-1 bg-surface-alt/50",
      },
      {
        title: "Honest Perspective",
        description: "Real-world experience from people who actually do the work.",
        icon: "Target",
        className: "md:col-span-1 md:row-span-1 bg-surface-alt/50",
      },
    ];

    return NextResponse.json({
      stats,
      team,
      values
    });
  } catch (error: any) {
    console.error("About API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
