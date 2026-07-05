import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd } = parseAnalyticsDates(req.url);
    
    const deviceTypeBreakdown = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: currentStart, $lte: currentEnd } } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } }
    ]);
    const devices = deviceTypeBreakdown.map((d: any) => ({
      name: d._id ? (d._id.charAt(0).toUpperCase() + d._id.slice(1)) : "Desktop",
      value: d.count
    }));

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error("Devices API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
