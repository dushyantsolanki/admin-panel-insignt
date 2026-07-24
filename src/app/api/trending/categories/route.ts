import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/category";

export async function GET() {
  try {
    let dbCategories: any[] = [];
    try {
      await connectDB();
      dbCategories = await Category.find({ status: "active" }).select("_id name slug color");
    } catch {
      // Graceful fallback if database connection is unavailable
    }

    const standardCategories = [
      { id: "all", name: "All Categories", slug: "all" },
      { id: "tech", name: "Technology", slug: "technology" },
      { id: "biz", name: "Business", slug: "business" },
      { id: "sports", name: "Sports", slug: "sports" },
      { id: "ent", name: "Entertainment", slug: "entertainment" },
      { id: "health", name: "Health", slug: "health" },
      { id: "sci", name: "Science", slug: "science" },
    ];

    // Combine DB categories with standard trending categories and deduplicate by slug
    const combined = [...standardCategories];
    const seenSlugs = new Set(standardCategories.map((c) => c.slug.toLowerCase()));

    for (const cat of dbCategories) {
      const slug = (cat.slug || cat.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        combined.push({
          id: cat._id.toString(),
          name: cat.name,
          slug,
        });
      }
    }

    return NextResponse.json({ categories: combined });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending categories" },
      { status: 500 }
    );
  }
}
