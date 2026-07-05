import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import Post from "@/models/post";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { currentStart, currentEnd } = parseAnalyticsDates(req.url);
    
    const popularPage = Number(searchParams.get("popularPage") || "1");
    const popularLimit = Number(searchParams.get("popularLimit") || "5");
    const popularSearch = searchParams.get("popularSearch") || "";

    let matchedSlugs: string[] | null = null;
    if (popularSearch) {
      const posts = await Post.find({
        $or: [
          { title: { $regex: popularSearch, $options: "i" } },
          { slug: { $regex: popularSearch, $options: "i" } }
        ]
      }, { slug: 1 });
      matchedSlugs = posts.map(p => p.slug);
    }

    const matchStage: any = { 
      timestamp: { $gte: currentStart, $lte: currentEnd },
      postSlug: { $exists: true, $ne: null } 
    };
    if (matchedSlugs !== null) {
      matchStage.postSlug = { $in: matchedSlugs };
    }

    const totalPopularPosts = await AnalyticsEvent.aggregate([
      { $match: matchStage },
      { $group: { _id: "$postSlug" } },
      { $count: "count" }
    ]);
    const totalCount = totalPopularPosts[0]?.count || 0;

    const popularPostsAgg = await AnalyticsEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$postSlug",
          views: { $sum: 1 },
          avgTime: { $avg: "$timeOnPage" },
          completions: {
            $sum: { $cond: [{ $eq: ["$completedRead", true] }, 1, 0] }
          }
        }
      },
      { $sort: { views: -1 } },
      { $skip: (popularPage - 1) * popularLimit },
      { $limit: popularLimit }
    ]);

    const popularPosts = [];
    for (const postLog of popularPostsAgg) {
      const postDetail = await Post.findOne({ slug: postLog._id })
        .populate("author", "name")
        .populate("category", "name");

      if (postDetail) {
        popularPosts.push({
          id: postDetail._id.toString(),
          title: postDetail.title,
          slug: postDetail.slug,
          views: postLog.views,
          avgTime: `${Math.floor(postLog.avgTime / 60)}:${Math.round(postLog.avgTime % 60).toString().padStart(2, "0")}m`,
          completionRate: postLog.views > 0 ? Math.round((postLog.completions / postLog.views) * 100) : 0,
          category: (postDetail.category as any)?.name || "Uncategorized",
          author: (postDetail.author as any)?.name || "Anonymous"
        });
      }
    }

    return NextResponse.json({
      popularPosts: {
        posts: popularPosts,
        pagination: {
          total: totalCount,
          page: popularPage,
          limit: popularLimit,
          pages: Math.ceil(totalCount / popularLimit)
        }
      }
    });
  } catch (error: any) {
    console.error("Popular API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
