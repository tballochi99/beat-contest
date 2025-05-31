import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contest from '@/models/Contest';

export async function GET() {
  try {
    await connectDB();
    
    const contests = await Contest.find({ status: 'active' })
      .populate('createdBy', 'name avatar')
      .sort({ startDate: -1 });

    return NextResponse.json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
} 