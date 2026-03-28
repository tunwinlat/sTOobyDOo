import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const setupSchema = z.object({
  familyName: z.string().min(1, 'Family name is required'),
  adminName: z.string().min(1, 'Name is required'),
  adminEmail: z.string().email('Invalid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  pushoverAppToken: z.string().optional(),
  pushoverUserKey: z.string().optional(),
  resendApiKey: z.string().optional(),
  resendFromEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if setup is already complete
    const existingFamily = await prisma.family.findFirst({
      where: { isSetupComplete: true },
    });

    if (existingFamily) {
      return NextResponse.json(
        { error: 'Setup already completed' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = setupSchema.parse(body);

    // Create family
    const family = await prisma.family.create({
      data: {
        name: validatedData.familyName,
        pushoverAppToken: validatedData.pushoverAppToken || null,
        pushoverUserKey: validatedData.pushoverUserKey || null,
        resendApiKey: validatedData.resendApiKey || null,
        resendFromEmail: validatedData.resendFromEmail || null,
        isSetupComplete: true,
      },
    });

    // Create admin member
    const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 12);
    
    const member = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        name: validatedData.adminName,
        email: validatedData.adminEmail,
        password: hashedPassword,
        isAdmin: true,
        pushoverUserKey: validatedData.pushoverUserKey || null,
      },
    });

    return NextResponse.json({
      success: true,
      family: {
        id: family.id,
        name: family.name,
      },
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        isAdmin: member.isAdmin,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const family = await prisma.family.findFirst({
      where: { isSetupComplete: true },
    });

    return NextResponse.json({
      isSetupComplete: !!family,
    });
  } catch (error) {
    console.error('Check setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
