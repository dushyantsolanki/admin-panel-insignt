import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";
import Author from "@/models/author";
import Category from "@/models/category";
import AnalyticsEvent from "@/models/analytics";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "latest";
    const status = searchParams.get("status") || "all";
    const categorySlug = searchParams.get("categorySlug");
    const authorId = searchParams.get("authorId");

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      // Find matching authors and categories first to support search by their names
      const [matchingAuthors, matchingCategories] = await Promise.all([
        Author.find({ name: { $regex: search, $options: "i" } }).select("_id"),
        Category.find({ name: { $regex: search, $options: "i" } }).select("_id"),
      ]);

      const authorIds = matchingAuthors.map((a: any) => a._id);
      const categoryIds = matchingCategories.map((c: any) => c._id);

      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { author: { $in: authorIds } },
        { category: { $in: categoryIds } },
      ];
    }

    if (status !== "all") {
      query.status = status;
    }

    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (category) {
        query.category = category._id;
      } else {
        // If category slug is provided but not found, return empty results early
        return NextResponse.json({
          posts: [],
          pagination: {
            totalPosts: 0,
            totalPages: 0,
            currentPage: page,
            limit,
            hasMore: false
          }
        });
      }
    }

    if (authorId) {
      query.author = authorId;
    }

    // Build sort
    let sortQuery: any = { createdAt: -1 };
    if (sort === "trending") {
      sortQuery = { views: -1 };
    } else if (sort === "oldest") {
      sortQuery = { createdAt: 1 };
    }

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find(query)
      .populate("author", "name avatar")
      .populate("category", "name color")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const slugs = posts.map(p => p.slug);
    const analytics = await AnalyticsEvent.aggregate([
      { $match: { postSlug: { $in: slugs } } },
      {
        $group: {
          _id: "$postSlug",
          views: { $sum: 1 },
          avgTime: { $avg: "$timeOnPage" },
          completions: {
            $sum: { $cond: [{ $eq: ["$completedRead", true] }, 1, 0] }
          }
        }
      }
    ]);

    const analyticsMap = new Map(analytics.map(a => [a._id, a]));

    const postsWithStats = posts.map(post => {
      const postObj = post.toObject();
      const stats = analyticsMap.get(post.slug);
      return {
        ...postObj,
        views: stats ? stats.views : (post.views || 0),
        avgTime: stats ? `${Math.floor(stats.avgTime / 60)}:${Math.round(stats.avgTime % 60).toString().padStart(2, "0")}m` : "0:00m",
        completionRate: stats && stats.views > 0 ? Math.round((stats.completions / stats.views) * 100) : 0
      };
    });

    return NextResponse.json({
      posts: postsWithStats,
      pagination: {
        totalPosts,
        totalPages,
        currentPage: page,
        limit,
        hasMore: page < totalPages
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1. Identify and authenticate user from JWT
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Please login first" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }

    const data = await req.json();



    // 3. Auto-generate excerpt if missing
    const text = (data.content || "").replace(/<[^>]*>/g, " ");
    const excerpt = data.excerpt || text.substring(0, 160) + "...";

    // 4. Create post with enforced author ID
    const newPost = new Post({
      ...data,
      author: decoded.userId, // Force author attribution to the authenticated user
      excerpt,
      views: 0,
      date: data.date || new Date(),
    });

    await newPost.save();
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Post slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
