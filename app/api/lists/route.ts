import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const listSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

// Get all lists for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await prisma.familyMember.findUnique({
      where: { id: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get lists created by user or shared with user
    const lists = await prisma.list.findMany({
      where: {
        familyId: member.familyId,
        isArchived: false,
        OR: [
          { tasks: { some: { createdById: member.id } } },
          { shares: { some: { memberId: member.id } } },
        ],
      },
      include: {
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
        shares: {
          include: {
            member: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Also get lists where user has created tasks
    const listsWithTasks = await prisma.list.findMany({
      where: {
        familyId: member.familyId,
        tasks: {
          some: { createdById: member.id },
        },
      },
      include: {
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
        shares: {
          include: {
            member: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Merge and deduplicate
    const allLists = [...lists, ...listsWithTasks];
    const uniqueLists = Array.from(new Map(allLists.map(l => [l.id, l])).values());

    return NextResponse.json(uniqueLists);
  } catch (error) {
    console.error('Get lists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = listSchema.parse(body);

    const member = await prisma.familyMember.findUnique({
      where: { id: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const list = await prisma.list.create({
      data: {
        familyId: member.familyId,
        name: validatedData.name,
        description: validatedData.description || null,
        color: validatedData.color || '#3b82f6',
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
