import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd } = parseAnalyticsDates(req.url);

    const referrerBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd } } },
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

    return NextResponse.json({ referrers });
  } catch (error: any) {
    console.error("Referrers API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
