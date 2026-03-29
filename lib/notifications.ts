import { Resend } from 'resend';
import { Pushover } from 'pushover-js';
import { prisma } from './db';

interface NotificationPayload {
  title: string;
  message: string;
  email?: string;
}

export async function sendNotification(
  familyId: string,
  memberId: string,
  payload: NotificationPayload
) {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
  });

  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
  });

  if (!family || !member) return;

  const results = {
    email: false,
    push: false,
  };

  // Send email notification
  if (member.emailNotifications && (family.resendApiKey || process.env.RESEND_API_KEY)) {
    try {
      const resendApiKey = family.resendApiKey || process.env.RESEND_API_KEY;
      const fromEmail = family.resendFromEmail || process.env.RESEND_FROM_EMAIL;
      
      if (resendApiKey && fromEmail) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: fromEmail,
          to: payload.email || member.email,
          subject: payload.title,
          text: payload.message,
        });
        results.email = true;
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  // Send push notification
  if (member.pushNotifications) {
    try {
      const appToken = family.pushoverAppToken || process.env.PUSHOVER_APP_TOKEN;
      const userKey = member.pushoverUserKey || family.pushoverUserKey || process.env.PUSHOVER_USER_KEY;
      
      if (appToken && userKey) {
        const pushover = new Pushover(userKey, appToken);
        await pushover.send(payload.title, payload.message);
        results.push = true;
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  return results;
}

export async function notifyTaskAssigned(
  familyId: string,
  assignedToId: string,
  taskTitle: string,
  listName: string,
  assignedByName: string
) {
  return sendNotification(familyId, assignedToId, {
    title: `New Task Assigned: ${taskTitle}`,
    message: `You've been assigned to "${taskTitle}" in the "${listName}" list by ${assignedByName}.`,
  });
}

export async function notifyTaskCompleted(
  familyId: string,
  createdById: string,
  taskTitle: string,
  listName: string,
  completedByName: string
) {
  return sendNotification(familyId, createdById, {
    title: `Task Completed: ${taskTitle}`,
    message: `"${taskTitle}" from "${listName}" has been completed by ${completedByName}.`,
  });
}

export async function notifyTaskDueSoon(
  familyId: string,
  memberId: string,
  taskTitle: string,
  listName: string,
  dueDate: Date
) {
  return sendNotification(familyId, memberId, {
    title: `Task Due Soon: ${taskTitle}`,
    message: `"${taskTitle}" from "${listName}" is due on ${dueDate.toLocaleDateString()}.`,
  });
}
