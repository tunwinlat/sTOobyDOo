import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if setup is complete
    const family = await prisma.family.findFirst({
      select: { id: true, name: true, isSetupComplete: true },
    });

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      setup: {
        complete: family?.isSetupComplete ?? false,
        familyName: family?.name ?? null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
