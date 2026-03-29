import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const memberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

// Check if user is admin
async function checkAdmin(session: any): Promise<{ isAdmin: boolean; familyId: string | null }> {
  if (!session?.user?.id) {
    return { isAdmin: false, familyId: null };
  }
  
  const member = await prisma.familyMember.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, familyId: true },
  });
  
  return { isAdmin: member?.isAdmin ?? false, familyId: member?.familyId ?? null };
}

// Add new family member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await checkAdmin(session);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = memberSchema.parse(body);

    // Check if email already exists
    const existingMember = await prisma.familyMember.findUnique({
      where: { email: validatedData.email },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const member = await prisma.familyMember.create({
      data: {
        familyId: adminCheck.familyId!,
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        isAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
