import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Beat from '@/models/Beat';
import Contest from '@/models/Contest';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { contestId, url } = await request.json();

    if (!contestId || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if contest exists and is active
    const contest = await Contest.findOne({
      _id: contestId,
      status: 'active',
    });

    if (!contest) {
      return NextResponse.json(
        { error: 'Contest not found or not active' },
        { status: 404 }
      );
    }

    // Check if user has already submitted a beat for this contest
    const existingBeat = await Beat.findOne({
      userId: session.user.id,
      contestId,
    });

    if (existingBeat) {
      return NextResponse.json(
        { error: 'You have already submitted a beat for this contest' },
        { status: 400 }
      );
    }

    // Create new beat
    const beat = await Beat.create({
      userId: session.user.id,
      contestId,
      url,
      round: 1,
      votes: 0,
    });

    return NextResponse.json(beat, { status: 201 });
  } catch (error) {
    console.error('Error submitting beat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 