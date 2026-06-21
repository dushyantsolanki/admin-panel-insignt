import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subscriber from "@/models/subscriber";
import { verifyToken } from "@/lib/jwt";

// PATCH: Update subscriber details (Admin Only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await req.json();

    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    if (body.status !== undefined) {
      subscriber.status = body.status;
      if (body.status === "unsubscribed") {
        subscriber.unsubscribedAt = new Date();
      } else {
        subscriber.unsubscribedAt = undefined;
      }
    }

    if (body.email !== undefined) {
      subscriber.email = body.email;
    }

    await subscriber.save();

    return NextResponse.json(subscriber);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete subscriber permanently (Admin Only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const subscriber = await Subscriber.findByIdAndDelete(id);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Subscriber deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
