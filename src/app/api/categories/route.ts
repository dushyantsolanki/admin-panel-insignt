import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/category";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const all = searchParams.get("all") === "true";
    const sort = searchParams.get("sort") || "name";
    
    const skip = (page - 1) * limit;

    // Build sort query
    let sortQuery: any = { name: 1 };
    if (sort === "popular") {
      sortQuery = { totalPost: -1 };
    }

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all") {
      query.status = status;
    }

    // Fetch data and count
    if (all) {
      const categories = await Category.find(query).sort(sortQuery);
      return NextResponse.json({
        categories,
        pagination: {
          totalCategories: categories.length,
          totalPages: 1,
          currentPage: 1,
          limit: categories.length,
          hasMore: false,
        },
      });
    }

    const [categories, totalCategories] = await Promise.all([
      Category.find(query).sort(sortQuery).skip(skip).limit(limit),
      Category.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCategories / limit);

    return NextResponse.json({
      categories,
      pagination: {
        totalCategories,
        totalPages,
        currentPage: page,
        limit,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    // Basic slugification if not provided
    if (!data.slug && data.name) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const newCategory = new Category({
      ...data,
      totalPost: data.totalPost || 0,
    });

    await newCategory.save();
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Category name or slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
