import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";
import Category from "@/models/category";
import AnalyticsEvent from "@/models/analytics";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get("category"); // Expecting category name from frontend
    const excludeSlug = searchParams.get("excludeSlug");
    const limit = parseInt(searchParams.get("limit") || "3");

    if (!categoryName) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // 1. Find the Category by name (since the frontend passes the name like "Technology")
    const category = await Category.findOne({ name: categoryName });
    
    if (!category) {
      return NextResponse.json({ posts: [] });
    }

    // 2. Find posts in this category, excluding the current post
    const query: any = {
      category: category._id,
      status: "published",
    };

    if (excludeSlug) {
      query.slug = { $ne: excludeSlug };
    }

    const posts = await Post.find(query)
      .populate("author", "name avatar")
      .populate("category", "name color");

    if (posts.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const slugs = posts.map(p => p.slug);

    // 3. Aggregate analytics for these posts to get views and avgTimeOnPage
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

    const analyticsMap = new Map(analytics.map(a => [a._id, a]));

    // 4. Enrich posts with stats and sort them
    let postsWithStats = posts.map(post => {
      const postObj = post.toObject();
      const stats = analyticsMap.get(post.slug);
      
      const views = stats ? stats.views : (post.views || 0);
      const avgTimeRaw = stats && stats.avgTime ? stats.avgTime : 0;
      const formattedAvgTime = avgTimeRaw > 0 
        ? `${Math.floor(avgTimeRaw / 60)}:${Math.round(avgTimeRaw % 60).toString().padStart(2, "0")}m`
        : "0:00m";

      return {
        ...postObj,
        views,
        avgTimeRaw, // used for sorting
        avgTime: formattedAvgTime
      };
    });

    // 5. Sort by views (descending) and then avgTimeRaw (descending)
    postsWithStats.sort((a, b) => {
      if (b.views !== a.views) {
        return b.views - a.views;
      }
      return b.avgTimeRaw - a.avgTimeRaw;
    });

    // 6. Limit results to top N
    const topPosts = postsWithStats.slice(0, limit);

    // 7. Clean up avgTimeRaw before returning
    const finalPosts = topPosts.map(p => {
      const { avgTimeRaw, ...rest } = p;
      return rest;
    });

    return NextResponse.json({ posts: finalPosts });
  } catch (error: any) {
    console.error("Error fetching suggested posts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
