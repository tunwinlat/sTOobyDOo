import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const mcpTokenUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  allowAllLists: z.boolean().optional(),
  listIds: z.array(z.string().uuid()).optional(),
  canCreateTasks: z.boolean().optional(),
  canCompleteTasks: z.boolean().optional(),
  canEditTasks: z.boolean().optional(),
  canDeleteTasks: z.boolean().optional(),
  canCreateLists: z.boolean().optional(),
  canEditLists: z.boolean().optional(),
  canDeleteLists: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get a specific MCP token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const token = await prisma.mcpToken.findFirst({
      where: {
        id,
        memberId: session.user.id,
      },
      include: {
        listAccess: {
          include: {
            list: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error('Get MCP token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an MCP token
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = mcpTokenUpdateSchema.parse(body);

    // Check ownership
    const existingToken = await prisma.mcpToken.findFirst({
      where: {
        id,
        memberId: session.user.id,
      },
    });

    if (!existingToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // If listIds are provided and allowAllLists is false, update list access
    if (validatedData.listIds !== undefined && validatedData.allowAllLists === false) {
      // Delete existing list access
      await prisma.mcpTokenListAccess.deleteMany({
        where: { mcpTokenId: id },
      });

      // Create new list access
      if (validatedData.listIds.length > 0) {
        await prisma.mcpTokenListAccess.createMany({
          data: validatedData.listIds.map(listId => ({
            mcpTokenId: id,
            listId,
          })),
        });
      }
    }

    const token = await prisma.mcpToken.update({
      where: { id },
      data: {
        name: validatedData.name,
        allowAllLists: validatedData.allowAllLists,
        canCreateTasks: validatedData.canCreateTasks,
        canCompleteTasks: validatedData.canCompleteTasks,
        canEditTasks: validatedData.canEditTasks,
        canDeleteTasks: validatedData.canDeleteTasks,
        canCreateLists: validatedData.canCreateLists,
        canEditLists: validatedData.canEditLists,
        canDeleteLists: validatedData.canDeleteLists,
      },
      include: {
        listAccess: {
          include: {
            list: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(token);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update MCP token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an MCP token
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existingToken = await prisma.mcpToken.findFirst({
      where: {
        id,
        memberId: session.user.id,
      },
    });

    if (!existingToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    await prisma.mcpToken.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete MCP token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
