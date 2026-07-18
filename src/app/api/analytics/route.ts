import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import Post from "@/models/post";

// Simple User Agent parser utility
function parseUserAgent(ua: string) {
  let browser = "Other";
  let os = "Other";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  // OS detection
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua) && !/like mac os x/i.test(ua)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser detection
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua) && !/opr|opios|chrome.*edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios|opr|opios|edg/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/opr|opera/i.test(ua)) browser = "Opera";

  // Device detection
  if (/ipad|tablet/i.test(ua)) {
    deviceType = "tablet";
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    deviceType = "mobile";
  }

  return { browser, os, deviceType };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const {
      viewId,
      visitorId,
      path,
      referrer,
      language,
      postSlug,
      timeOnPage = 0,
      completedRead = false,
      utmSource,
      utmMedium,
      utmCampaign,
    } = data;

    if (!viewId || !visitorId || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userAgentString = req.headers.get("user-agent") || "";
    const { browser, os, deviceType } = parseUserAgent(userAgentString);

    // Check if this page view already exists before updating (to increment views counter once)
    const exists = await AnalyticsEvent.exists({ viewId });
    if (!exists && postSlug) {
      await Post.findOneAndUpdate({ slug: postSlug }, { $inc: { views: 1 } });
    }

    // Upsert the event record
    const event = await AnalyticsEvent.findOneAndUpdate(
      { viewId },
      {
        $set: {
          visitorId,
          path,
          referrer: referrer || "",
          userAgent: userAgentString,
          browser,
          os,
          deviceType,
          language: language || "en",
          postSlug: postSlug || undefined,
          utmSource,
          utmMedium,
          utmCampaign,
        },
        $max: {
          timeOnPage,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If completedRead becomes true, update it
    if (completedRead) {
      event.completedRead = true;
      await event.save();
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Analytics POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "7d"; // 7d or 30d
    const popularPage = Number(searchParams.get("popularPage") || "1");
    const popularLimit = Number(searchParams.get("popularLimit") || "5");
    const popularSearch = searchParams.get("popularSearch") || "";

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // 1. Calculate stats cards data
    // Total & Monthly posts
    const totalPostsCount = await Post.countDocuments();
    const totalPostsPrevious = await Post.countDocuments({ createdAt: { $lt: thirtyDaysAgo } });
    const postsChange = totalPostsPrevious > 0
      ? Math.round(((totalPostsCount - totalPostsPrevious) / totalPostsPrevious) * 100)
      : (totalPostsCount > 0 ? 100 : 0);

    // Monthly page views (last 30 days vs previous 30 days)
    const viewsCurrent = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });
    const viewsPrevious = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const viewsChange = viewsPrevious > 0
      ? Math.round(((viewsCurrent - viewsPrevious) / viewsPrevious) * 100)
      : (viewsCurrent > 0 ? 100 : 0);

    // Unique readers (last 30 days vs previous 30 days)
    const distinctReadersCurrent = await AnalyticsEvent.distinct("visitorId", {
      timestamp: { $gte: thirtyDaysAgo }
    });
    const readersCurrent = distinctReadersCurrent.length;

    const distinctReadersPrevious = await AnalyticsEvent.distinct("visitorId", {
      timestamp: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const readersPrevious = distinctReadersPrevious.length;

    const readersChange = readersPrevious > 0
      ? Math.round(((readersCurrent - readersPrevious) / readersPrevious) * 100)
      : (readersCurrent > 0 ? 100 : 0);

    // Avg Read Time (last 30 days vs previous 30 days)
    const avgReadCurrentResult = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo }, postSlug: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgTime: { $avg: "$timeOnPage" } } }
    ]);
    const avgTimeCurrent = avgReadCurrentResult[0]?.avgTime || 0; // seconds

    const avgReadPreviousResult = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, postSlug: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgTime: { $avg: "$timeOnPage" } } }
    ]);
    const avgTimePrevious = avgReadPreviousResult[0]?.avgTime || 0;

    const avgTimeChange = avgTimePrevious > 0
      ? Math.round(((avgTimeCurrent - avgTimePrevious) / avgTimePrevious) * 100)
      : (avgTimeCurrent > 0 ? 100 : 0);

    const minutes = Math.floor(avgTimeCurrent / 60);
    const seconds = Math.round(avgTimeCurrent % 60);
    const avgReadTimeStr = `${minutes}:${seconds.toString().padStart(2, "0")}m`;

    // 2. Performance chart data (daily pageviews)
    const daysLimit = period === "30d" ? 30 : 7;
    const chartStartDate = new Date();
    chartStartDate.setDate(now.getDate() - daysLimit + 1);
    chartStartDate.setHours(0, 0, 0, 0);

    const dailyViewsAndVisitors = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: chartStartDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          views: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyMetricsMap = new Map<string, { views: number, visitors: number }>();
    dailyViewsAndVisitors.forEach((v: any) => {
      dailyMetricsMap.set(v._id, { views: v.views, visitors: v.visitors.length });
    });

    const chartData = [];
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < daysLimit; i++) {
      const d = new Date(chartStartDate);
      d.setDate(chartStartDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const metrics = dailyMetricsMap.get(dateStr) || { views: 0, visitors: 0 };

      if (daysLimit === 7) {
        chartData.push({
          day: dayNamesShort[d.getDay()],
          views: metrics.views,
          visitors: metrics.visitors
        });
      } else {
        const month = d.toLocaleDateString("en-US", { month: "short" });
        const dayNum = d.getDate();
        chartData.push({
          day: `${month} ${dayNum}`,
          views: metrics.views,
          visitors: metrics.visitors
        });
      }
    }

    // 3. Popular posts list
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

    const matchStage: any = { postSlug: { $exists: true, $ne: null } };
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

    // 4. Device, Referrer, Browser and OS Breakdowns
    const deviceTypeBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: chartStartDate } } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } }
    ]);
    const devices = deviceTypeBreakdown.map((d: any) => ({
      name: d._id ? (d._id.charAt(0).toUpperCase() + d._id.slice(1)) : "Desktop",
      value: d.count
    }));

    const referrerBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: chartStartDate } } },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ["$referrer", ""] }, { $not: ["$referrer"] }] },
              "Direct / Search",
              "$referrer"
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);
    const referrers = referrerBreakdown.map((r: any) => {
      let name = r._id;
      if (name.startsWith("http")) {
        try {
          name = new URL(name).hostname;
        } catch (_) { }
      }
      return { name, value: r.count };
    });

    const browserBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: chartStartDate } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const browsers = browserBreakdown.map((b: any) => ({
      name: b._id || "Other",
      value: b.count
    }));

    const osBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: chartStartDate } } },
      { $group: { _id: "$os", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const os = osBreakdown.map((o: any) => ({
      name: o._id || "Other",
      value: o.count
    }));

    // 5. Traffic/Share Sources (utmSource) Breakdown
    const shareSourceBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: chartStartDate }, utmSource: { $exists: true, $ne: null } } },
      { $group: { _id: "$utmSource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);
    const shareSources = shareSourceBreakdown.map((s: any) => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count
    }));

    return NextResponse.json({
      stats: {
        totalPosts: { value: totalPostsCount.toLocaleString(), change: postsChange },
        monthlyViews: { value: viewsCurrent.toLocaleString(), change: viewsChange },
        avgReadTime: { value: avgReadTimeStr, change: avgTimeChange },
        totalReaders: { value: readersCurrent.toLocaleString(), change: readersChange }
      },
      performanceChartData: chartData,
      popularPosts: {
        posts: popularPosts,
        pagination: {
          total: totalCount,
          page: popularPage,
          limit: popularLimit,
          pages: Math.ceil(totalCount / popularLimit)
        }
      },
      devices,
      referrers,
      browsers,
      os,
      shareSources
    });
  } catch (error: any) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
