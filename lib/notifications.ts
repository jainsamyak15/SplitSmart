import { toast } from "sonner";

// Check if notifications are supported and permission is granted
export async function checkNotificationPermission() {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Schedule a notification
export async function scheduleNotification(title: string, options: { 
  body: string;
  delay: number; // Delay in minutes
  tag?: string;
  data?: any;
}) {
  const hasPermission = await checkNotificationPermission();
  
  if (!hasPermission) {
    toast.error("Please enable notifications to receive reminders");
    return;
  }

  // Store notification in localStorage
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const notification = {
    id: Date.now().toString(),
    title,
    body: options.body,
    scheduledFor: Date.now() + (options.delay * 60 * 1000),
    tag: options.tag || 'default',
    data: options.data
  };
  
  notifications.push(notification);
  localStorage.setItem('notifications', JSON.stringify(notifications));

  // Schedule the notification
  setTimeout(() => {
    new Notification(title, {
      body: options.body,
      tag: options.tag,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: options.data
    });

    // Remove from localStorage after showing
    const currentNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem(
      'notifications', 
      JSON.stringify(currentNotifications.filter((n: any) => n.id !== notification.id))
    );
  }, options.delay * 60 * 1000);

  return notification.id;
}

// Schedule expense notification
export async function scheduleExpenseNotification(expense: any) {
  // Early return if expense is not properly structured
  if (!expense || !expense.splits || !expense.paidBy) {
    console.warn('Invalid expense data for notification:', expense);
    return;
  }

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (!currentUser?.id) {
    console.warn('No user found in localStorage');
    return;
  }

  // Find the split for the current user
  const userSplit = expense.splits.find((split: any) => split.debtor?.id === currentUser.id);
  const isPayer = userSplit !== undefined;
  const isReceiver = expense.paidBy?.id === currentUser.id;

  if (!isPayer && !isReceiver) {
    console.log('User is neither payer nor receiver');
    return;
  }

  if (isPayer && userSplit) {
    // User needs to pay
    await scheduleNotification(
      "Payment Reminder",
      {
        body: `You need to pay ₹${userSplit.amount.toFixed(2)} to ${expense.paidBy.name || expense.paidBy.phone} for ${expense.description}`,
        delay: 60, // 1 hour
        tag: `expense-pay-${expense.id}`,
        data: {
          type: 'expense-payment',
          expenseId: expense.id,
          amount: userSplit.amount,
          toUser: expense.paidBy
        }
      }
    );
  }

  if (isReceiver) {
    // Calculate total amount to receive, excluding self-splits
    const totalToReceive = expense.splits.reduce((sum: number, split: any) => 
      split.debtor?.id !== currentUser.id ? sum + (split.amount || 0) : sum, 
      0
    );

    if (totalToReceive > 0) {
      await scheduleNotification(
        "Payment Collection Reminder",
        {
          body: `You need to collect ₹${totalToReceive.toFixed(2)} for ${expense.description}`,
          delay: 1440, // 24 hours
          tag: `expense-collect-${expense.id}`,
          data: {
            type: 'expense-collection',
            expenseId: expense.id,
            amount: totalToReceive
          }
        }
      );
    }
  }
}

// Cancel a scheduled notification
export function cancelNotification(id: string) {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  localStorage.setItem(
    'notifications', 
    JSON.stringify(notifications.filter((n: any) => n.id !== id))
  );
}

// Get all pending notifications
export function getPendingNotifications() {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  return notifications.filter((n: any) => n.scheduledFor > Date.now());
}