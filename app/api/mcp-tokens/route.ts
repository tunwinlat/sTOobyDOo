import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const mcpTokenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  allowAllLists: z.boolean().default(true),
  listIds: z.array(z.string().uuid()).optional(),
  canCreateTasks: z.boolean().default(true),
  canCompleteTasks: z.boolean().default(true),
  canEditTasks: z.boolean().default(true),
  canDeleteTasks: z.boolean().default(false),
  canCreateLists: z.boolean().default(false),
  canEditLists: z.boolean().default(false),
  canDeleteLists: z.boolean().default(false),
});

// Get all MCP tokens for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await prisma.mcpToken.findMany({
      where: {
        memberId: session.user.id,
      },
      include: {
        listAccess: {
          include: {
            list: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Get MCP tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new MCP token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = mcpTokenSchema.parse(body);

    // Generate a secure random token
    const token = `mcp_${randomUUID().replace(/-/g, '')}_${randomUUID().replace(/-/g, '')}`;

    const mcpToken = await prisma.mcpToken.create({
      data: {
        familyId: session.user.familyId,
        memberId: session.user.id,
        token,
        name: validatedData.name,
        allowAllLists: validatedData.allowAllLists,
        canCreateTasks: validatedData.canCreateTasks,
        canCompleteTasks: validatedData.canCompleteTasks,
        canEditTasks: validatedData.canEditTasks,
        canDeleteTasks: validatedData.canDeleteTasks,
        canCreateLists: validatedData.canCreateLists,
        canEditLists: validatedData.canEditLists,
        canDeleteLists: validatedData.canDeleteLists,
        listAccess: validatedData.listIds && !validatedData.allowAllLists
          ? {
              create: validatedData.listIds.map(listId => ({ listId })),
            }
          : undefined,
      },
      include: {
        listAccess: {
          include: {
            list: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(mcpToken, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create MCP token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
