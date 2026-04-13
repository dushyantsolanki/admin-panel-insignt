import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "published";
    const sort = searchParams.get("sort") || "latest";

    // Build query
    const query: any = {};
    if (status !== "all") {
      query.status = status;
    }

    // Build sort
    let sortQuery: any = { date: -1 };
    if (sort === "oldest") {
      sortQuery = { date: 1 };
    } else if (sort === "trending") {
      sortQuery = { views: -1 };
    }

    const posts = await Post.find(query)
      .populate("author", "name avatar bio role")
      .populate("category", "name slug")
      .sort(sortQuery);

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("Error fetching all posts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
