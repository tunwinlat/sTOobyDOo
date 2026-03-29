import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyTaskCompleted } from '@/lib/notifications';

// MCP Server Implementation with SSE
// This implements the Model Context Protocol for LLM integration

interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// Valid MCP tools definition
const MCP_TOOLS = [
  {
    name: 'get_lists',
    description: 'Get all todo lists accessible to the user',
    inputSchema: {
      type: 'object',
      properties: {
        includeArchived: {
          type: 'boolean',
          description: 'Whether to include archived lists',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_list_tasks',
    description: 'Get all tasks in a specific list with their subtasks',
    inputSchema: {
      type: 'object',
      properties: {
        listId: {
          type: 'string',
          description: 'The ID of the list',
        },
        includeCompleted: {
          type: 'boolean',
          description: 'Whether to include completed tasks',
          default: false,
        },
        includeArchived: {
          type: 'boolean',
          description: 'Whether to include archived tasks',
          default: false,
        },
      },
      required: ['listId'],
    },
  },
  {
    name: 'get_task',
    description: 'Get details of a specific task including subtasks',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'search_tasks',
    description: 'Search for tasks by title or description',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        listId: {
          type: 'string',
          description: 'Optional: Limit search to a specific list',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a list',
    inputSchema: {
      type: 'object',
      properties: {
        listId: {
          type: 'string',
          description: 'The ID of the list to add the task to',
        },
        title: {
          type: 'string',
          description: 'The title of the task',
        },
        description: {
          type: 'string',
          description: 'Optional description of the task',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority level of the task',
          default: 'medium',
        },
        dueDate: {
          type: 'string',
          description: 'Optional due date in ISO 8601 format',
        },
        parentId: {
          type: 'string',
          description: 'Optional parent task ID for creating subtasks (max 2 levels)',
        },
      },
      required: ['listId', 'title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to complete',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'uncomplete_task',
    description: 'Mark a completed task as not completed',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to uncomplete',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'update_task',
    description: 'Update task details',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to update',
        },
        title: {
          type: 'string',
          description: 'New title for the task',
        },
        description: {
          type: 'string',
          description: 'New description for the task',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'New priority level',
        },
        dueDate: {
          type: 'string',
          description: 'New due date in ISO 8601 format (or null to remove)',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to delete',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'archive_task',
    description: 'Archive a completed task instead of deleting it',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to archive',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_list',
    description: 'Create a new todo list',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the list',
        },
        description: {
          type: 'string',
          description: 'Optional description of the list',
        },
        color: {
          type: 'string',
          description: 'Color in hex format (e.g., #3b82f6)',
          default: '#3b82f6',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_all_open_tasks',
    description: 'Get all open (incomplete) tasks across all accessible lists',
    inputSchema: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Optional filter by priority',
        },
      },
    },
  },
];

// Validate MCP token and get permissions
async function validateMcpToken(token: string) {
  const mcpToken = await prisma.mcpToken.findUnique({
    where: { token },
    include: {
      member: true,
      listAccess: {
        select: { listId: true },
      },
    },
  });

  if (!mcpToken) return null;

  // Update last used
  await prisma.mcpToken.update({
    where: { id: mcpToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    ...mcpToken,
    allowedListIds: mcpToken.allowAllLists 
      ? null 
      : mcpToken.listAccess.map(la => la.listId),
  };
}

// Execute MCP tool
async function executeTool(
  toolName: string,
  params: any,
  auth: Awaited<ReturnType<typeof validateMcpToken>>
): Promise<any> {
  if (!auth) throw new Error('Unauthorized');

  const { member, allowedListIds } = auth;

  switch (toolName) {
    case 'get_lists': {
      const lists = await prisma.list.findMany({
        where: {
          familyId: member.familyId,
          isArchived: params?.includeArchived ? undefined : false,
          ...(allowedListIds ? { id: { in: allowedListIds } } : {}),
        },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          createdAt: true,
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
      return { lists };
    }

    case 'get_list_tasks': {
      if (!params?.listId) throw new Error('listId is required');
      if (allowedListIds && !allowedListIds.includes(params.listId)) {
        throw new Error('Access denied to this list');
      }

      const tasks = await prisma.task.findMany({
        where: {
          listId: params.listId,
          list: { familyId: member.familyId },
          isArchived: params?.includeArchived ? undefined : false,
          isCompleted: params?.includeCompleted ? undefined : false,
          parentId: null, // Only top-level tasks
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          subtasks: {
            where: { isArchived: false },
            include: {
              assignedTo: { select: { id: true, name: true } },
              subtasks: {
                where: { isArchived: false },
                include: {
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
      return { tasks };
    }

    case 'get_task': {
      if (!params?.taskId) throw new Error('taskId is required');

      const task = await prisma.task.findFirst({
        where: {
          id: params.taskId,
          list: { familyId: member.familyId },
        },
        include: {
          list: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          subtasks: {
            where: { isArchived: false },
            include: {
              assignedTo: { select: { id: true, name: true } },
              subtasks: {
                where: { isArchived: false },
                include: {
                  assignedTo: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      if (!task) throw new Error('Task not found');
      if (allowedListIds && !allowedListIds.includes(task.listId)) {
        throw new Error('Access denied to this task');
      }

      return { task };
    }

    case 'search_tasks': {
      const tasks = await prisma.task.findMany({
        where: {
          list: { 
            familyId: member.familyId,
            ...(allowedListIds ? { id: { in: allowedListIds } } : {}),
          },
          ...(params?.listId ? { listId: params.listId } : {}),
          OR: [
            { title: { contains: params.query } },
            { description: { contains: params.query } },
          ],
          isArchived: false,
        },
        include: {
          list: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        take: 20,
      });
      return { tasks };
    }

    case 'create_task': {
      if (!auth.canCreateTasks) throw new Error('Permission denied: cannot create tasks');
      if (!params?.listId || !params?.title) throw new Error('listId and title are required');
      if (allowedListIds && !allowedListIds.includes(params.listId)) {
        throw new Error('Access denied to this list');
      }

      // Check nesting level
      if (params?.parentId) {
        const parent = await prisma.task.findUnique({
          where: { id: params.parentId },
        });
        if (!parent) throw new Error('Parent task not found');
        if (parent.parentId) throw new Error('Cannot nest more than 2 levels deep');
      }

      const task = await prisma.task.create({
        data: {
          listId: params.listId,
          title: params.title,
          description: params?.description || null,
          priority: params?.priority || 'medium',
          dueDate: params?.dueDate ? new Date(params.dueDate) : null,
          createdById: member.id,
          parentId: params?.parentId || null,
        },
        include: {
          list: { select: { name: true } },
        },
      });

      return { 
        success: true, 
        task,
        message: `Task "${task.title}" created in list "${task.list.name}"`,
      };
    }

    case 'complete_task': {
      if (!auth.canCompleteTasks) throw new Error('Permission denied: cannot complete tasks');
      if (!params?.taskId) throw new Error('taskId is required');

      const existingTask = await prisma.task.findFirst({
        where: {
          id: params.taskId,
          list: { familyId: member.familyId },
        },
        include: { list: { select: { id: true, name: true } } },
      });

      if (!existingTask) throw new Error('Task not found');
      if (allowedListIds && !allowedListIds.includes(existingTask.listId)) {
        throw new Error('Access denied to this task');
      }

      const task = await prisma.task.update({
        where: { id: params.taskId },
        data: { isCompleted: true },
        include: {
          createdBy: { select: { id: true } },
          list: { select: { name: true } },
        },
      });

      // Notify creator
      if (task.createdBy && task.createdBy.id !== member.id) {
        await notifyTaskCompleted(
          member.familyId,
          task.createdBy.id,
          task.title,
          task.list.name,
          member.name
        );
      }

      return { 
        success: true, 
        task,
        message: `Task "${task.title}" marked as complete`,
      };
    }

    case 'uncomplete_task': {
      if (!auth.canEditTasks) throw new Error('Permission denied: cannot edit tasks');
      if (!params?.taskId) throw new Error('taskId is required');

      const existingTask = await prisma.task.findFirst({
        where: {
          id: params.taskId,
          list: { familyId: member.familyId },
        },
      });

      if (!existingTask) throw new Error('Task not found');
      if (allowedListIds && !allowedListIds.includes(existingTask.listId)) {
        throw new Error('Access denied to this task');
      }

      const task = await prisma.task.update({
        where: { id: params.taskId },
        data: { isCompleted: false },
      });

      return { 
        success: true, 
        task,
        message: `Task "${task.title}" marked as incomplete`,
      };
    }

    case 'update_task': {
      if (!auth.canEditTasks) throw new Error('Permission denied: cannot edit tasks');
      if (!params?.taskId) throw new Error('taskId is required');

      const existingTask = await prisma.task.findFirst({
        where: {
          id: params.taskId,
          list: { familyId: member.familyId },
        },
      });

      if (!existingTask) throw new Error('Task not found');
      if (allowedListIds && !allowedListIds.includes(existingTask.listId)) {
        throw new Error('Access denied to this task');
      }

      const updateData: any = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.priority !== undefined) updateData.priority = params.priority;
      if (params.dueDate !== undefined) {
        updateData.dueDate = params.dueDate ? new Date(params.dueDate) : null;
      }

      const task = await prisma.task.update({
        where: { id: params.taskId },
        data: updateData,
      });

      return { 
        success: true, 
        task,
        message: `Task "${task.title}" updated successfully`,
      };
    }

    case 'delete_task': {
      if (!auth.canDeleteTasks) throw new Error('Permission denied: cannot delete tasks');
      if (!params?.taskId) throw new Error('taskId is required');

      const existingTask = await prisma.task.findFirst({
        where: {
          id: params.taskId,
          list: { familyId: member.familyId },
        },
      });

      if (!existingTask) throw new Error('Task not found');
      if (allowedListIds && !allowedListIds.includes(existingTask.listId)) {
        throw new Error('Access denied to this task');
      }

      await prisma.task.delete({ where: { id: params.taskId } });

      return { 
        success: true, 
        message: `Task "${existingTask.title}" deleted permanently`,
      };
    }

    case 'archive_task': {
      if (!auth.canEditTasks) throw new Error('Permission denied: cannot edit tasks');
      if (!params?.taskId) throw new Error('taskId is required');

      const existingTask = await prisma.task.findFirst({
        where: {
          id: params.taskId,
          list: { familyId: member.familyId },
        },
      });

      if (!existingTask) throw new Error('Task not found');
      if (allowedListIds && !allowedListIds.includes(existingTask.listId)) {
        throw new Error('Access denied to this task');
      }

      const task = await prisma.task.update({
        where: { id: params.taskId },
        data: { isArchived: true },
      });

      return { 
        success: true, 
        task,
        message: `Task "${task.title}" archived`,
      };
    }

    case 'create_list': {
      if (!auth.canCreateLists) throw new Error('Permission denied: cannot create lists');

      const list = await prisma.list.create({
        data: {
          familyId: member.familyId,
          name: params.name,
          description: params?.description || null,
          color: params?.color || '#3b82f6',
        },
      });

      return { 
        success: true, 
        list,
        message: `List "${list.name}" created successfully`,
      };
    }

    case 'get_all_open_tasks': {
      const tasks = await prisma.task.findMany({
        where: {
          list: { 
            familyId: member.familyId,
            ...(allowedListIds ? { id: { in: allowedListIds } } : {}),
          },
          isCompleted: false,
          isArchived: false,
          parentId: null,
          ...(params?.priority ? { priority: params.priority } : {}),
        },
        include: {
          list: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, name: true } },
          subtasks: {
            where: { isArchived: false },
            select: { id: true, isCompleted: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return { tasks };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Handle MCP requests
async function handleMcpRequest(
  request: McpRequest,
  authToken: string
): Promise<McpResponse> {
  const auth = await validateMcpToken(authToken);

  if (!auth) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32001, message: 'Invalid or expired token' },
    };
  }

  try {
    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'todo-family-mcp',
              version: '1.0.0',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools: MCP_TOOLS },
        };

      case 'tools/call': {
        const { name, arguments: args } = request.params || {};
        if (!name) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32602, message: 'Tool name is required' },
          };
        }

        const result = await executeTool(name, args || {}, auth);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      }

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: `Method not found: ${request.method}` },
        };
    }
  } catch (error: any) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32000, message: error.message || 'Internal error' },
    };
  }
}

// SSE Endpoint for MCP
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response('Token is required', { status: 401 });
  }

  const auth = await validateMcpToken(token);
  if (!auth) {
    return new Response('Invalid token', { status: 401 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial endpoint event
      const endpointEvent = `event: endpoint\ndata: /api/mcp?token=${token}\n\n`;
      controller.enqueue(encoder.encode(endpointEvent));

      // Keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// POST endpoint for MCP requests (non-SSE mode)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                new URL(request.url).searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 401 }
    );
  }

  try {
    const body: McpRequest = await request.json();
    const response = await handleMcpRequest(body, token);
    return NextResponse.json(response);
  } catch (error) {
    console.error('MCP request error:', error);
    return NextResponse.json(
      { 
        jsonrpc: '2.0', 
        id: null, 
        error: { code: -32700, message: 'Parse error' } 
      },
      { status: 400 }
    );
  }
}
