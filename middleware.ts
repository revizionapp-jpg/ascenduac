import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // L'accès aux épreuves et à la plateforme requiert impérativement une session active (cookie)
        return !!token;
      },
    },
    pages: {
      signIn: '/',
    },
  }
);

export const config = {
  matcher: [
    '/epreuves/:path*',
    '/deposer/:path*',
    '/mes-depots/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
  ],
};
