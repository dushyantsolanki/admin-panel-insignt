import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import Post from "@/models/post";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd, previousStart, previousEnd } = parseAnalyticsDates(req.url);

    // Total & Monthly posts
    const totalPostsCount = await Post.countDocuments();
    const totalPostsPrevious = await Post.countDocuments({ createdAt: { $lt: currentStart } });
    const postsChange = totalPostsPrevious > 0
      ? Math.round(((totalPostsCount - totalPostsPrevious) / totalPostsPrevious) * 100)
      : (totalPostsCount > 0 ? 100 : 0);

    // Monthly page views
    const viewsCurrent = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: currentStart, $lte: currentEnd }
    });
    const viewsPrevious = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: previousStart, $lt: previousEnd }
    });
    const viewsChange = viewsPrevious > 0
      ? Math.round(((viewsCurrent - viewsPrevious) / viewsPrevious) * 100)
      : (viewsCurrent > 0 ? 100 : 0);

    // Unique readers
    const distinctReadersCurrent = await AnalyticsEvent.distinct("visitorId", {
      timestamp: { $gte: currentStart, $lte: currentEnd }
    });
    const readersCurrent = distinctReadersCurrent.length;

    const distinctReadersPrevious = await AnalyticsEvent.distinct("visitorId", {
      timestamp: { $gte: previousStart, $lt: previousEnd }
    });
    const readersPrevious = distinctReadersPrevious.length;

    const readersChange = readersPrevious > 0
      ? Math.round(((readersCurrent - readersPrevious) / readersPrevious) * 100)
      : (readersCurrent > 0 ? 100 : 0);

    // Avg Read Time
    const avgReadCurrentResult = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd }, postSlug: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgTime: { $avg: "$timeOnPage" } } }
    ]);
    const avgTimeCurrent = avgReadCurrentResult[0]?.avgTime || 0;

    const avgReadPreviousResult = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: previousStart, $lt: previousEnd }, postSlug: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgTime: { $avg: "$timeOnPage" } } }
    ]);
    const avgTimePrevious = avgReadPreviousResult[0]?.avgTime || 0;

    const avgTimeChange = avgTimePrevious > 0
      ? Math.round(((avgTimeCurrent - avgTimePrevious) / avgTimePrevious) * 100)
      : (avgTimeCurrent > 0 ? 100 : 0);

    const minutes = Math.floor(avgTimeCurrent / 60);
    const seconds = Math.round(avgTimeCurrent % 60);
    const avgReadTimeStr = `${minutes}:${seconds.toString().padStart(2, "0")}m`;

    return NextResponse.json({
      stats: {
        totalPosts: { value: totalPostsCount.toLocaleString(), change: postsChange },
        monthlyViews: { value: viewsCurrent.toLocaleString(), change: viewsChange },
        avgReadTime: { value: avgReadTimeStr, change: avgTimeChange },
        totalReaders: { value: readersCurrent.toLocaleString(), change: readersChange }
      }
    });
  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
