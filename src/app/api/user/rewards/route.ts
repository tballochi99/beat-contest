import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ici, vous devriez récupérer les récompenses depuis la base de données
    // Pour l'instant, nous retournons des données de test
    
    const mockRewards = [
      {
        id: '1',
        title: 'First Win',
        description: 'Won your first beat contest',
        date: new Date().toISOString(),
        type: 'win' as const
      },
      {
        id: '2',
        title: 'Perfect Score',
        description: 'Received a perfect score in a contest',
        date: new Date().toISOString(),
        type: 'achievement' as const
      },
      {
        id: '3',
        title: 'Community Favorite',
        description: 'Your beat was voted community favorite',
        date: new Date().toISOString(),
        type: 'special' as const
      }
    ];

    return NextResponse.json(mockRewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
} 