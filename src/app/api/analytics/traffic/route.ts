import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd, daysDifference } = parseAnalyticsDates(req.url);

    const dailyViewsAndVisitors = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd } } },
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

    for (let i = 0; i < daysDifference; i++) {
      const d = new Date(currentStart);
      d.setDate(currentStart.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const metrics = dailyMetricsMap.get(dateStr) || { views: 0, visitors: 0 };

      if (daysDifference <= 7) {
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

    return NextResponse.json({
      performanceChartData: chartData
    });
  } catch (error: any) {
    console.error("Traffic API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
