import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyTaskDueSoon } from '@/lib/notifications';

// Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET;

// GET handler for cron job (called by Vercel Cron or external scheduler)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find tasks with reminders due in the next 5 minutes that haven't been sent yet
    const tasksWithReminders = await prisma.task.findMany({
      where: {
        reminderAt: {
          lte: fiveMinutesFromNow,
          gte: now,
        },
        reminderSent: false,
        isCompleted: false,
        isArchived: false,
      },
      include: {
        list: { select: { id: true, name: true, familyId: true } },
        assignedTo: { select: { id: true, emailNotifications: true, pushNotifications: true } },
        createdBy: { select: { id: true, emailNotifications: true, pushNotifications: true } },
      },
    });

    const results = [];

    for (const task of tasksWithReminders) {
      try {
        // Determine who to notify
        const notifyMemberId = task.assignedToId || task.createdById;
        
        if (notifyMemberId && task.list) {
          // Send notification
          await notifyTaskDueSoon(
            task.list.familyId,
            notifyMemberId,
            task.title,
            task.list.name,
            task.dueDate || task.reminderAt!
          );

          // Mark reminder as sent
          await prisma.task.update({
            where: { id: task.id },
            data: { reminderSent: true },
          });

          results.push({
            taskId: task.id,
            title: task.title,
            notified: true,
            memberId: notifyMemberId,
          });
        }
      } catch (error) {
        console.error(`Failed to send reminder for task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          title: task.title,
          notified: false,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checkedAt: now.toISOString(),
      remindersSent: results.filter(r => r.notified).length,
      tasks: results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST handler for manual triggering (admin only)
export async function POST(request: NextRequest) {
  try {
    // For manual triggering, we could add admin authentication here
    // For now, require the same cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reuse the same logic as GET
    return GET(request);
  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
