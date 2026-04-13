import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Author from "@/models/author";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const author = await Author.findById(id);
    if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });

    const authorObj = author.toObject();
    if (authorObj.password) {
      authorObj.password = decrypt(authorObj.password);
    }

    return NextResponse.json(authorObj);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();


    // Encrypt password if provided and not empty
    if (data.password && data.password.trim() !== "") {
      data.password = encrypt(data.password);
    } else {
      delete data.password; // Don't update password if it's empty
    }

    const updatedAuthor = await Author.findByIdAndUpdate(id, data, { new: true });
    if (!updatedAuthor) return NextResponse.json({ error: "Author not found" }, { status: 404 });
    return NextResponse.json(updatedAuthor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const deletedAuthor = await Author.findByIdAndDelete(id);
    if (!deletedAuthor) return NextResponse.json({ error: "Author not found" }, { status: 404 });
    return NextResponse.json({ message: "Author deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
