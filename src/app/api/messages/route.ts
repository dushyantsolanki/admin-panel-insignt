import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Message from "@/models/message";
import { verifyToken } from "@/lib/jwt";

// Simple in-memory rate limiting map: ip -> lastRequestTime[]
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

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
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

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { senderName: { $regex: search, $options: "i" } },
        { senderEmail: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all") {
      query.status = status;
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments(query);

    return NextResponse.json({
      messages,
      pagination: {
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page,
        limit,
        hasMore: page < Math.ceil(totalMessages / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again in an hour." },
        { status: 429 }
      );
    }

    const data = await req.json();

    // Basic validation
    if (!data.senderName || !data.senderEmail || !data.subject || !data.content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = new Message({
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      subject: data.subject,
      content: data.content,
      status: 'unread'
    });

    await newMessage.save();

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
