import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";

type Props = {
  params: Promise<{ slug: string }>
}

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    await connectDB();

    const { slug } = await params;

    const post = await Post.findOne({ slug })
      .populate("author", "name avatar bio role")
      .populate("category", "name slug color");

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Optional: Increment view count when fetching by slug
    // post.views = (post.views || 0) + 1;
    // await post.save().catch((e: any) => console.error("Error updating views:", e));

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error("Error fetching post by slug:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
