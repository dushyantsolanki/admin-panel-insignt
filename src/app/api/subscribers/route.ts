import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subscriber from "@/models/subscriber";
import { verifyToken } from "@/lib/jwt";

// Simple in-memory rate limiting map for subscriptions: ip -> lastRequestTime[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Filter out requests older than the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}

// GET: Fetch list of subscribers (Admin Only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Authenticate admin user
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.email = { $regex: search, $options: "i" };
    }

    if (status !== "all") {
      query.status = status;
    }

    const subscribers = await Subscriber.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalSubscribers = await Subscriber.countDocuments(query);
    
    // Aggregated stats for the overview cards
    const activeCount = await Subscriber.countDocuments({ status: "active" });
    const unsubscribedCount = await Subscriber.countDocuments({ status: "unsubscribed" });
    const pendingCount = await Subscriber.countDocuments({ status: "pending" });

    return NextResponse.json({
      subscribers,
      stats: {
        total: activeCount + unsubscribedCount + pendingCount,
        active: activeCount,
        unsubscribed: unsubscribedCount,
        pending: pendingCount
      },
      pagination: {
        totalSubscribers,
        totalPages: Math.ceil(totalSubscribers / limit),
        currentPage: page,
        limit,
        hasMore: page < Math.ceil(totalSubscribers / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add new subscription (Publicly Accessible)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many signups. Please try again in an hour." },
        { status: 429 }
      );
    }

    const data = await req.json();

    // Basic validation
    if (!data.email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.findOne({ email: data.email });
    if (existingSubscriber) {
      if (existingSubscriber.status === "active") {
        return NextResponse.json({ error: "You are already subscribed to our newsletter!" }, { status: 409 });
      }
      
      // Re-activate if they were unsubscribed or pending
      existingSubscriber.status = "active";
      existingSubscriber.unsubscribedAt = undefined;
      await existingSubscriber.save();
      return NextResponse.json(existingSubscriber, { status: 200 });
    }

    const newSubscriber = new Subscriber({
      email: data.email,
      status: "active", // Single opt-in by default
      source: data.source || "footer"
    });

    await newSubscriber.save();

    return NextResponse.json(newSubscriber, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
