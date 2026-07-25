import { NextResponse } from "next/server";
import { hasR2Credentials, generateR2PresignedUrl } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Filename is required." },
        { status: 400 }
      );
    }

    const cleanFilename = filename.replace(/[^\w\s.-]/gi, "_");
    const r2Key = `uploads/${Date.now()}_${cleanFilename}`;

    if (hasR2Credentials()) {
      const presignedData = await generateR2PresignedUrl(
        r2Key,
        contentType || "application/octet-stream"
      );

      return NextResponse.json({
        success: true,
        isR2Configured: true,
        uploadUrl: presignedData.uploadUrl,
        filePublicUrl: presignedData.filePublicUrl,
        r2Key,
      });
    }

    // Direct Cloudflare R2 Public CDN URL construction
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "blog-media";
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "cloudflare-r2";
    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://${bucketName}.${accountId}.r2.dev`;
    const filePublicUrl = `${publicDomain.replace(/\/$/, "")}/${r2Key}`;

    return NextResponse.json({
      success: true,
      isR2Configured: false,
      uploadUrl: null, // Signals client to use direct R2 multipart upload route
      filePublicUrl,
      r2Key,
    });
  } catch (error: any) {
    console.error("Error generating Cloudflare R2 presigned URL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate Cloudflare R2 presigned URL.",
      },
      { status: 500 }
    );
  }
}
