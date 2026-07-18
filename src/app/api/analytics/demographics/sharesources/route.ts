import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AnalyticsEvent from "@/models/analytics";
import { parseAnalyticsDates } from "@/lib/analytics-utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { currentStart, currentEnd } = parseAnalyticsDates(req.url);

    const shareSourceBreakdown = await AnalyticsEvent.aggregate([
      { 
        $match: { 
          timestamp: { $gte: currentStart, $lte: currentEnd },
          utmSource: { $exists: true, $ne: null }
        } 
      },
      { $group: { _id: "$utmSource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);
    
    const shareSources = shareSourceBreakdown.map((s: any) => ({
      name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      value: s.count
    }));

    return NextResponse.json({ shareSources });
  } catch (error: any) {
    console.error("ShareSources API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
