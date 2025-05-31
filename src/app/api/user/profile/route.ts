import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const data = await request.json();
    
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: data.username,
          bio: data.bio,
          socialLinks: data.socialLinks,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      // Si l'utilisateur n'existe pas, on le crée
      const newUser = await User.create({
        email: session.user.email,
        name: data.username,
        bio: data.bio,
        socialLinks: data.socialLinks,
        username: data.username,
        avatar: session.user.image || 'https://via.placeholder.com/150'
      });
      return NextResponse.json({
        message: 'Profile created successfully',
        user: newUser
      });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({
        user: {
          email: session.user.email,
          name: session.user.name,
          bio: '',
          socialLinks: {
            soundcloud: '',
            instagram: '',
            twitter: ''
          }
        }
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 