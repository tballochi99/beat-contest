import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/contests/submit/:path*',
    '/profile/:path*',
    '/api/beats/:path*',
    '/api/votes/:path*',
  ],
}; 