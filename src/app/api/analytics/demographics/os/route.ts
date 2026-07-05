import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd } = parseAnalyticsDates(req.url);

    const osBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd } } },
      { $group: { _id: "$os", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const os = osBreakdown.map((o: any) => ({
      name: o._id || "Other",
      value: o.count
    }));

    return NextResponse.json({ os });
  } catch (error: any) {
    console.error("OS API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
