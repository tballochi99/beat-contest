import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contest from '@/models/Contest';

export async function GET() {
  try {
    await connectDB();
    
    const currentContest = await Contest.findOne({
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('createdBy', 'name avatar');

    if (!currentContest) {
      return NextResponse.json({ error: 'No active contest found' }, { status: 404 });
    }

    return NextResponse.json(currentContest);
  } catch (error) {
    console.error('Error fetching current contest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 