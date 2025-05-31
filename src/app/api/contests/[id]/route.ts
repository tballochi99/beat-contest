import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contest from '@/models/Contest';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const contest = await Contest.findById(params.id)
      .populate('createdBy', 'name avatar')
      .populate('submissions.user', 'name avatar');

    if (!contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contest' },
      { status: 500 }
    );
  }
} 