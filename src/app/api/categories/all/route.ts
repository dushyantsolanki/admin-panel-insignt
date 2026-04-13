import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/category";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";
    const sort = searchParams.get("sort") || "name";

    // Build sort query
    let sortQuery: any = { name: 1 };
    if (sort === "popular") {
      sortQuery = { totalPost: -1 };
    }

    // Build query
    const query: any = {};
    if (status !== "all") {
      query.status = status;
    }

    const categories = await Category.find(query).sort(sortQuery);

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching all categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
