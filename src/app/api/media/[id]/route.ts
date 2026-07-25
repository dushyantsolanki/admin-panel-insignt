import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Media from "@/models/media";
import { deleteR2Object } from "@/lib/r2";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing media ID." },
        { status: 400 }
      );
    }

    const media = await Media.findById(id);

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media item not found." },
        { status: 404 }
      );
    }

    // If item was stored in Cloudflare R2, delete the object from R2 bucket
    if (media.r2Key) {
      await deleteR2Object(media.r2Key);
    }

    await Media.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Media file deleted successfully from Cloudflare R2 & Database.",
    });
  } catch (error: any) {
    console.error("Error deleting media item:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete media item.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updatedMedia = await Media.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedMedia) {
      return NextResponse.json(
        { success: false, error: "Media item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      media: updatedMedia,
    });
  } catch (error: any) {
    console.error("Error updating media item:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update media item.",
      },
      { status: 500 }
    );
  }
}
