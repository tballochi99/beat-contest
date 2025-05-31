import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contest from '@/models/Contest';

export async function GET() {
  try {
    await connectDB();
    
    const now = new Date();
    const contest = await Contest.findOne({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .populate('createdBy', 'name avatar')
    .populate('submissions.user', 'name avatar');

    if (!contest) {
      return NextResponse.json(
        { error: 'No active contest found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error fetching current contest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current contest' },
      { status: 500 }
    );
  }
} 