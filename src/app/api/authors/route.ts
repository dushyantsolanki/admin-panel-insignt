import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Author from "@/models/author";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (name) {
      // Normalize name by replacing hyphens with a regex that matches space or hyphen
      const searchPattern = "^" + name.replace(/-/g, "[ -]") + "$";
      const author = await Author.findOne({
        name: { $regex: new RegExp(searchPattern, "i") }
      });
      if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });

      const authorObj = author.toObject();
      if (authorObj.password) {
        authorObj.password = decrypt(authorObj.password);
      }
      return NextResponse.json(authorObj);
    }

    const authors = await Author.find({}).sort({ createdAt: -1 });

    // Decrypt passwords for the UI
    const decryptedAuthors = authors.map(author => {
      const authorObj = author.toObject();
      if (authorObj.password) {
        authorObj.password = decrypt(authorObj.password);
      }
      return authorObj;
    });

    return NextResponse.json(decryptedAuthors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    // Encrypt password if provided
    if (data.password) {
      data.password = encrypt(data.password);
    }

    const newAuthor = new Author({
      ...data,
      avatar: data?.avatar || null,
      totalPost: data.totalPost || 0,
    });

    await newAuthor.save();
    return NextResponse.json(newAuthor, { status: 201 });
  } catch (error: any) {
    console.error("Error creating author:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
