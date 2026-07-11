import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "../../../../../models/post";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findById(id).select('audioData audioContentType');

    if (!post || !post.audioData) {
      return new NextResponse("Audio not found", { status: 404 });
    }

    // Convert base64 string back to buffer
    const audioBuffer = Buffer.from(post.audioData, 'base64');
    const contentType = post.audioContentType || 'audio/mpeg';

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error("Error serving audio:", error);
    return NextResponse.json(
      { error: "Failed to serve audio", details: error.message },
      { status: 500 }
    );
  }
}
