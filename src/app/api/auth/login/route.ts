import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Author from '@/models/author';
import { decrypt } from '@/lib/encryption';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find author by email
    const author = await Author.findOne({ email });

    if (!author) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Decrypt and compare password
    const decryptedPassword = decrypt(author.password || '');
    
    if (decryptedPassword !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token
    const token = signToken({
      userId: author._id,
      email: author.email,
      role: author.role,
    });

    // Prepare user data for response (excluding password)
    const userData = {
      id: author._id,
      name: author.name,
      email: author.email,
      role: author.role,
      avatar: author.avatar,
    };

    const response = NextResponse.json({
      message: 'Login successful',
      user: userData,
      token,
    });

    // Set HTTP-only cookie for middleware protection (7 days)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_BIT === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
