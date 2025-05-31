import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Contest from '@/models/Contest';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Vérifier si l'utilisateur est admin
async function isAdmin(session: any) {
  if (!session?.user) return false;
  return session.user.role === 'admin';
}

// GET /api/admin/contests
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const contests = await Contest.find()
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}

// POST /api/admin/contests
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const data = await request.json();

    const contest = await Contest.create({
      ...data,
      createdBy: session.user.id,
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { error: 'Failed to create contest' },
      { status: 500 }
    );
  }
} 