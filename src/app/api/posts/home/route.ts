import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch hero posts (all where isHero is true)
    const heroPosts = await Post.find({ isHero: true, status: "published" })
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort({ date: -1 });

    // Fetch featured posts (all where isFeatured is true)
    const featuredPosts = await Post.find({ isFeatured: true, status: "published" })
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort({ date: -1 });

    // Fetch latest posts
    const latestPosts = await Post.find({ status: "published" })
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort({ date: -1 })
      .limit(10);

    return NextResponse.json({
      heroPosts,
      featuredPosts,
      latestPosts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { id, isHero, isFeatured } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (isHero !== undefined) updateData.isHero = isHero;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
