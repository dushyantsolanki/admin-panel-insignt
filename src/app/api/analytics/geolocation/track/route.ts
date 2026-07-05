import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Geolocation from '../../../../../../models/geolocation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Extract headers
    // Vercel sets these automatically if enabled/available
    const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
    const state = req.headers.get('x-vercel-ip-country-region') || 'Unknown';
    const city = req.headers.get('x-vercel-ip-city') || 'Unknown';
    const lat = req.headers.get('x-vercel-ip-latitude');
    const lng = req.headers.get('x-vercel-ip-longitude');
    const ip = req.headers.get('x-forwarded-for') || 'Unknown';
    
    // Simple ip hash for privacy (if you don't want to store raw IP)
    // Here we'll just store the first few chars or raw depending on privacy needs.
    // Actually, storing raw IP might be a privacy concern (GDPR), so we can hash it or omit it.
    // For now, let's omit the full IP and just use it as a hashed identifier if we want unique views,
    // but the frontend will send the request once per session.
    
    // To support testing locally or if headers are empty, we can also accept a body fallback
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty
    }
    
    const finalCountry = (body as any).country || country;
    const finalState = (body as any).state || state;
    const finalCity = (body as any).city || city;
    const finalLat = (body as any).latitude || (lat ? parseFloat(lat) : undefined);
    const finalLng = (body as any).longitude || (lng ? parseFloat(lng) : undefined);

    const geoRecord = new Geolocation({
      country: finalCountry,
      state: finalState,
      city: finalCity,
      latitude: finalLat,
      longitude: finalLng,
      // ipHash: ip // store if needed
    });

    await geoRecord.save();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in geolocation track API:', error);
    return NextResponse.json(
      { error: 'Failed to track geolocation' },
      { status: 500 }
    );
  }
}
