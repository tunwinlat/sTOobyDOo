import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { notifyTaskCompleted } from '@/lib/notifications';

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isCompleted: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get a specific task
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        list: {
          familyId: session.user.familyId,
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        list: { select: { id: true, name: true, color: true } },
        parent: {
          select: { id: true, title: true },
        },
        subtasks: {
          where: { isArchived: false },
          include: {
            createdBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
            subtasks: {
              where: { isArchived: false },
              include: {
                createdBy: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = taskUpdateSchema.parse(body);

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        list: {
          familyId: session.user.familyId,
        },
      },
      include: {
        list: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check edit permissions
    const hasEditAccess = await prisma.listShare.findFirst({
      where: {
        listId: existingTask.listId,
        memberId: session.user.id,
        canEdit: true,
      },
    });

    if (!hasEditAccess && existingTask.createdById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - no edit permission' },
        { status: 403 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate !== undefined 
          ? (validatedData.dueDate ? new Date(validatedData.dueDate) : null)
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        list: { select: { id: true, name: true, color: true } },
        subtasks: {
          where: { isArchived: false },
          include: {
            createdBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Send notification if task was completed
    if (validatedData.isCompleted && !existingTask.isCompleted) {
      if (existingTask.createdById !== session.user.id) {
        await notifyTaskCompleted(
          session.user.familyId,
          existingTask.createdById,
          existingTask.title,
          existingTask.list.name,
          session.user.name || 'Someone'
        );
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        list: {
          familyId: session.user.familyId,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check delete permissions
    const hasDeleteAccess = await prisma.listShare.findFirst({
      where: {
        listId: existingTask.listId,
        memberId: session.user.id,
        canDelete: true,
      },
    });

    if (!hasDeleteAccess && existingTask.createdById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - no delete permission' },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
