import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";
import moment from "moment-timezone";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd, daysDifference } = parseAnalyticsDates(req.url);

    const TIMEZONE = "Asia/Kolkata";

    const dailyViewsAndVisitors = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: TIMEZONE } },
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

    for (let i = 0; i < daysDifference; i++) {
      const d = moment(currentStart).tz(TIMEZONE).add(i, 'days');
      const dateStr = d.format("YYYY-MM-DD");
      const metrics = dailyMetricsMap.get(dateStr) || { views: 0, visitors: 0 };

      if (daysDifference <= 7) {
        chartData.push({
          day: d.format("ddd"),
          views: metrics.views,
          visitors: metrics.visitors
        });
      } else {
        chartData.push({
          day: d.format("MMM D"),
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
