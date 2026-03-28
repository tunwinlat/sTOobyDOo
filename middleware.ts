import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Protect API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Allow setup endpoint without auth
      if (req.nextUrl.pathname === '/api/setup') {
        return NextResponse.next();
      }
      
      // Allow MCP endpoint with token auth (handled in route)
      if (req.nextUrl.pathname === '/api/mcp') {
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow setup endpoint
        if (req.nextUrl.pathname === '/api/setup') {
          return true;
        }
        
        // Allow MCP endpoint with token auth
        if (req.nextUrl.pathname === '/api/mcp') {
          return true;
        }

        // Require auth for all other routes
        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/lists/:path*',
    '/settings/:path*',
    '/api/lists/:path*',
    '/api/tasks/:path*',
    '/api/subtasks/:path*',
    '/api/mcp-tokens/:path*',
    '/api/user/:path*',
  ],
};
