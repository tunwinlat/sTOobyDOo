import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const listUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isArchived: z.boolean().optional(),
});

interface RouteParams {
  params: { id: string };
}

// Get a specific list
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const list = await prisma.list.findFirst({
      where: {
        id,
        familyId: session.user.familyId,
      },
      include: {
        shares: {
          include: {
            member: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: {
            tasks: {
              where: {
                isCompleted: false,
                isArchived: false,
                parentId: null,
              },
            },
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Get list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a list
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = listUpdateSchema.parse(body);

    // Check if user has access to edit this list
    const existingList = await prisma.list.findFirst({
      where: {
        id,
        familyId: session.user.familyId,
        OR: [
          { shares: { some: { memberId: session.user.id, canEdit: true } } },
        ],
      },
    });

    if (!existingList && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - no edit permission' },
        { status: 403 }
      );
    }

    const list = await prisma.list.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(list);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if user has delete permission
    const existingList = await prisma.list.findFirst({
      where: {
        id,
        familyId: session.user.familyId,
        OR: [
          { shares: { some: { memberId: session.user.id, canDelete: true } } },
        ],
      },
    });

    if (!existingList && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - no delete permission' },
        { status: 403 }
      );
    }

    await prisma.list.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
