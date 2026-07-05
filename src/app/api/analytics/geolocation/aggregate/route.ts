import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Geolocation from '../../../../../../models/geolocation';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build match criteria based on date range
    const matchCriteria: any = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) {
        matchCriteria.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchCriteria.createdAt.$lte = new Date(endDate);
      }
    }

    // Aggregate data by country, state, and city
    const aggregatedData = await Geolocation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            country: '$country',
            state: '$state',
            city: '$city'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.country',
          totalCount: { $sum: '$count' },
          states: {
            $push: {
              state: '$_id.state',
              city: '$_id.city',
              count: '$count'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          country: '$_id',
          totalCount: 1,
          states: 1
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    return NextResponse.json({ success: true, data: aggregatedData }, { status: 200 });
  } catch (error) {
    console.error('Error in geolocation aggregate API:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate geolocation data' },
      { status: 500 }
    );
  }
}
