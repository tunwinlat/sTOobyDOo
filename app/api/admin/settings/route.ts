import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const adminSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  pushoverAppToken: z.string().optional().nullable(),
  pushoverUserKey: z.string().optional().nullable(),
  resendApiKey: z.string().optional().nullable(),
  resendFromEmail: z.string().email().optional().nullable(),
});

// Check if user is admin
async function checkAdmin(session: any) {
  if (!session?.user?.id) return false;
  
  const member = await prisma.familyMember.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  
  return member?.isAdmin ?? false;
}

// Get admin settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!await checkAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await prisma.familyMember.findUnique({
      where: { id: session.user.id },
      select: { familyId: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const [family, members] = await Promise.all([
      prisma.family.findUnique({
        where: { id: member.familyId },
        select: {
          name: true,
          pushoverAppToken: true,
          pushoverUserKey: true,
          resendApiKey: true,
          resendFromEmail: true,
        },
      }),
      prisma.familyMember.findMany({
        where: { familyId: member.familyId },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
        },
      }),
    ]);

    return NextResponse.json({
      ...family,
      members,
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update admin settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!await checkAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = adminSettingsSchema.parse(body);

    const member = await prisma.familyMember.findUnique({
      where: { id: session.user.id },
      select: { familyId: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const family = await prisma.family.update({
      where: { id: member.familyId },
      data: validatedData,
    });

    return NextResponse.json(family);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update admin settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
