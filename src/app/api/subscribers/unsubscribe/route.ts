import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subscriber from "@/models/subscriber";

// GET: Unsubscribe via email link (e.g., /api/subscribers/unsubscribe?token=xyz)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; color: #374151;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; text-align: center;">
              <h2 style="color: #ef4444;">Invalid Request</h2>
              <p>Unsubscribe token is missing.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    const subscriber = await Subscriber.findOne({ token });

    if (!subscriber) {
      return new NextResponse(
        `<html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; color: #374151;">
            <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; text-align: center;">
              <h2 style="color: #ef4444;">Link Expired</h2>
              <p>We could not find a subscriber associated with this token.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" }, status: 404 }
      );
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Unsubscribed Successfully</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f8fafc;
              color: #0f172a;
            }
            .card {
              background: #ffffff;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
              max-width: 440px;
              text-align: center;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h2 {
              margin: 0 0 12px 0;
              font-size: 24px;
              font-weight: 700;
            }
            p {
              margin: 0 0 24px 0;
              color: #64748b;
              font-size: 15px;
              line-height: 1.5;
            }
            .btn {
              display: inline-block;
              background-color: #0f172a;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 500;
              font-size: 14px;
              transition: background-color 0.2s;
            }
            .btn:hover {
              background-color: #1e293b;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✉️</div>
            <h2>Unsubscribed</h2>
            <p>You have been successfully removed from our newsletter list. We're sorry to see you go!</p>
            <a href="/" class="btn">Go to Blog</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; color: #374151;">
          <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; text-align: center;">
            <h2 style="color: #ef4444;">Error</h2>
            <p>${error.message}</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}

// POST: Direct API request to unsubscribe (for custom integrations or manual admin use)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.email && !data.token) {
      return NextResponse.json({ error: "Email or unsubscribe token is required" }, { status: 400 });
    }

    const query = data.token ? { token: data.token } : { email: data.email };
    const subscriber = await Subscriber.findOne(query);

    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return NextResponse.json({ success: true, message: "Successfully unsubscribed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
