import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { notifyTaskAssigned } from '@/lib/notifications';

const taskSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedToId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

// Get all tasks (for dashboard - open tasks from all lists)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const isCompleted = searchParams.get('isCompleted');
    const isArchived = searchParams.get('isArchived');
    const includeAll = searchParams.get('includeAll');

    const where: any = {
      list: {
        familyId: session.user.familyId,
      },
      parentId: null, // Only get top-level tasks, not subtasks
    };

    if (listId) {
      where.listId = listId;
    }

    if (isCompleted !== null) {
      where.isCompleted = isCompleted === 'true';
    }

    if (isArchived !== null) {
      where.isArchived = isArchived === 'true';
    } else if (!includeAll) {
      where.isArchived = false;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        list: {
          select: { id: true, name: true, color: true },
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
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    // Check if user has access to the list
    const list = await prisma.list.findFirst({
      where: {
        id: validatedData.listId,
        familyId: session.user.familyId,
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'List not found or access denied' },
        { status: 404 }
      );
    }

    // If parentId is provided, verify it exists and belongs to the same list
    if (validatedData.parentId) {
      const parentTask = await prisma.task.findFirst({
        where: {
          id: validatedData.parentId,
          listId: validatedData.listId,
        },
      });

      if (!parentTask) {
        return NextResponse.json(
          { error: 'Parent task not found' },
          { status: 404 }
        );
      }

      // Check if parent already has a parent (limit to 2 levels)
      if (parentTask.parentId) {
        return NextResponse.json(
          { error: 'Cannot nest more than 2 levels deep' },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        listId: validatedData.listId,
        title: validatedData.title,
        description: validatedData.description || null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        priority: validatedData.priority,
        createdById: session.user.id,
        assignedToId: validatedData.assignedToId || null,
        parentId: validatedData.parentId || null,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        list: { select: { id: true, name: true, color: true } },
      },
    });

    // Send notification if assigned to someone else
    if (task.assignedToId && task.assignedToId !== session.user.id) {
      await notifyTaskAssigned(
        session.user.familyId,
        task.assignedToId,
        task.title,
        list.name,
        task.createdBy?.name || 'Someone'
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
