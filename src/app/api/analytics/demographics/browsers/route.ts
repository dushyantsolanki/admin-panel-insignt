import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd } = parseAnalyticsDates(req.url);

    const browserBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const browsers = browserBreakdown.map((b: any) => ({
      name: b._id || "Other",
      value: b.count
    }));

    return NextResponse.json({ browsers });
  } catch (error: any) {
    console.error("Browsers API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
