import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";
import AnalyticsEvent from "../../../../../models/analytics";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch hero posts (all where isHero is true)
    const heroPosts = await Post.find({ isHero: true, status: "published" })
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort({ date: -1 });

    // Fetch featured posts (all where isFeatured is true)
    const featuredPosts = await Post.find({ isFeatured: true, status: "published" })
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort({ date: -1 });

    // Fetch latest posts
    const latestPosts = await Post.find({ status: "published" })
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort({ date: -1 })
      .limit(10);

    // Gather all unique slugs across all three post groups
    const allPosts = [...heroPosts, ...featuredPosts, ...latestPosts];
    const slugs = [...new Set(allPosts.map((p: any) => p.slug))];

    // Aggregate real analytics from DB
    const analytics = await AnalyticsEvent.aggregate([
      { $match: { postSlug: { $in: slugs } } },
      {
        $group: {
          _id: "$postSlug",
          views: { $sum: 1 },
          avgTime: { $avg: "$timeOnPage" }
        }
      }
    ]);

    const analyticsMap = new Map(analytics.map((a: any) => [a._id, a]));

    const addStats = (postsArr: any[]) =>
      postsArr.map(post => {
        const obj = post.toObject ? post.toObject() : post;
        const stats = analyticsMap.get(obj.slug);
        return {
          ...obj,
          views: stats ? stats.views : (obj.views || 0),
          avgTime: stats
            ? `${Math.floor(stats.avgTime / 60)}:${Math.round(stats.avgTime % 60).toString().padStart(2, "0")}m`
            : "0:00m",
        };
      });

    return NextResponse.json({
      heroPosts: addStats(heroPosts),
      featuredPosts: addStats(featuredPosts),
      latestPosts: addStats(latestPosts)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { id, isHero, isFeatured } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (isHero !== undefined) updateData.isHero = isHero;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
