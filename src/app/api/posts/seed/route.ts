import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Post from "@/models/post";
import Author from "@/models/author";
import Category from "@/models/category";

export async function POST() {
  try {
    await connectDB();

    // 1. Fetch some authors and categories to associate
    const authors = await Author.find({});
    const categories = await Category.find({});

    if (authors.length === 0 || categories.length === 0) {
      return NextResponse.json({ 
        error: "Please ensure you have at least one author and one category before seeding posts." 
      }, { status: 400 });
    }

    const titles = [
      "The Future of Artificial Intelligence",
      "Designing for Accessibility in 2026",
      "How to Build a Modern Blog with Next.js",
      "The Rise of Glassmorphism in UI Design",
      "Mastering TypeScript for Enterprise Apps",
      "Healthy Habits for Remote Developers",
      "A Guide to Sustainable Architecture",
      "Digital Minimalsm: Why Less is More",
      "The Science of Sleep and Productivity",
      "Cybersecurity Trends to Watch This Year"
    ];

    const newPosts = [];

    for (let i = 1; i <= 100; i++) {
      const baseTitle = titles[Math.floor(Math.random() * titles.length)];
      const title = `${baseTitle} #${i}`;
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const author = authors[Math.floor(Math.random() * authors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      newPosts.push({
        title,
        slug,
        content: `
          <h2>Introduction</h2>
          <p>This is a seeded post number ${i}. It was generated automatically for testing purposes.</p>
          <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
          <h3>Main Section</h3>
          <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
          <blockquote>"The best way to predict the future is to invent it." - Alan Kay</blockquote>
          <p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
        `,
        excerpt: `Discover the details of ${title}. A deep dive into modern trends and technical insights.`,
        category: category._id,
        author: author._id,
        status: i % 15 === 0 ? "draft" : "published",
        image: `https://images.unsplash.com/photo-${1600000000000 + i}?auto=format&fit=crop&q=80&w=1200`,
        views: Math.floor(Math.random() * 5000),
        readTime: `${Math.floor(Math.random() * 10) + 3} min read`,
        date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
      });
    }

    // Insert many, skipping duplicates
    await Post.insertMany(newPosts, { ordered: false }).catch(err => {
      console.log("Some posts were already seeded or had duplicate slugs.");
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully seeded 100 posts.",
      count: 100
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
