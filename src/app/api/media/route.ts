import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Media from "@/models/media";
import { hasR2Credentials, uploadR2Buffer } from "@/lib/r2";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "12", 10));
    const search = searchParams.get("search") || "";
    const typeFilter = searchParams.get("type") || "all";
    const starredOnly = searchParams.get("starred") === "true";

    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (typeFilter && typeFilter !== "all") {
      query.type = typeFilter;
    }

    if (starredOnly) {
      query.starred = true;
    }

    const totalMedia = await Media.countDocuments(query);
    const totalPages = Math.ceil(totalMedia / limit) || 1;
    const skip = (page - 1) * limit;

    const mediaList = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const imageCount = await Media.countDocuments({ type: "image" });
    const videoCount = await Media.countDocuments({ type: "video" });
    const audioCount = await Media.countDocuments({ type: "audio" });
    const starredCount = await Media.countDocuments({ starred: true });
    const isR2Configured = hasR2Credentials();

    return NextResponse.json({
      success: true,
      media: mediaList,
      stats: {
        totalFiles: imageCount + videoCount + audioCount,
        imageCount,
        videoCount,
        audioCount,
        starredCount,
        isR2Configured,
        r2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || "blog-media",
        r2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || "pub-r2.dev CDN",
      },
      pagination: {
        totalMedia,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Cloudflare R2 media list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch media library.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const contentTypeHeader = request.headers.get("content-type") || "";

    const detectType = (filename: string, mimeType?: string): "image" | "video" | "audio" => {
      if (mimeType?.startsWith("video/") || Boolean(filename.match(/\.(mp4|webm|mov|mkv)$/i))) {
        return "video";
      }
      if (mimeType?.startsWith("audio/") || Boolean(filename.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i))) {
        return "audio";
      }
      return "image";
    };

    // Case 1: JSON payload (metadata created after client-side direct Cloudflare R2 presigned upload)
    if (contentTypeHeader.includes("application/json")) {
      const body = await request.json();
      const { name, type, url, size, r2Key, starred } = body;

      if (!name || !url) {
        return NextResponse.json(
          { success: false, error: "Missing required media fields." },
          { status: 400 }
        );
      }

      const mediaItem = await Media.create({
        name,
        type: type || detectType(name),
        url,
        size: size || "1.0 MB",
        starred: Boolean(starred),
        r2Key: r2Key || `uploads/${Date.now()}_${name.replace(/[^\w\s.-]/gi, "_")}`,
        storageProvider: "cloudflare_r2",
      });

      return NextResponse.json({
        success: true,
        media: mediaItem,
      });
    }

    // Case 2: Multipart FormData Upload directly to Cloudflare R2
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided in form data." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cleanFilename = file.name.replace(/[^\w\s.-]/gi, "_");
    const r2Key = `uploads/${Date.now()}_${cleanFilename}`;
    const detectedMediaType = detectType(file.name, file.type);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = `${sizeInMB} MB`;

    let finalPublicUrl = "";

    if (hasR2Credentials()) {
      const r2Result = await uploadR2Buffer(r2Key, buffer, file.type || "application/octet-stream");
      finalPublicUrl = r2Result.filePublicUrl;
    } else {
      // Direct CDN fallback URL format
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "blog-media";
      const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "cloud-r2";
      const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://${bucketName}.${accountId}.r2.dev`;
      finalPublicUrl = `${publicDomain.replace(/\/$/, "")}/${r2Key}`;
    }

    const newMedia = await Media.create({
      name: file.name,
      type: detectedMediaType,
      url: finalPublicUrl,
      size: formattedSize,
      starred: false,
      r2Key,
      storageProvider: "cloudflare_r2",
    });

    return NextResponse.json({
      success: true,
      media: newMedia,
    });
  } catch (error: any) {
    console.error("Error uploading to Cloudflare R2 media storage:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to upload file to Cloudflare R2 cloud storage.",
      },
      { status: 500 }
    );
  }
}
