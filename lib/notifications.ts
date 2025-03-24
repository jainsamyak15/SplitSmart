import { toast } from "sonner";

// Check if notifications are supported and permission is granted
export async function checkNotificationPermission() {
  // Check if running in iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    toast.error("Notifications are not supported on iOS devices. Please use the app on Android or desktop.");
    return false;
  }

  // Check if notifications are supported
  if (!("Notification" in window)) {
    toast.error("Notifications are not supported in this browser");
    return false;
  }

  // Check if running as standalone PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        // Suggest installing PWA if not already installed
        if (!isStandalone) {
          toast.info("Install our app for better notification support!", {
            duration: 5000,
            description: "Add to Home Screen for reliable notifications"
          });
        }
        return true;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
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
      data: options.data,
      requireInteraction: true, // Keep notification visible until user interacts
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

  console.log('Current user:', currentUser.id);
  console.log('Expense:', expense);
  console.log('Splits:', expense.splits);

  // Check if user needs to pay (they are in splits as a debtor)
  const debtorSplits = expense.splits.filter((split: any) => 
    split.debtorId === currentUser.id
  );

  // Check if user needs to collect (they are the payer)
  const isCreditor = expense.paidById === currentUser.id;

  console.log('Debtor splits:', debtorSplits);
  console.log('Is creditor:', isCreditor);

  // Send notifications for each split where user is debtor
  for (const split of debtorSplits) {
    await scheduleNotification(
      "Payment Reminder",
      {
        body: `You need to pay ₹${split.amount.toFixed(2)} to ${expense.paidBy.name || expense.paidBy.phone} for ${expense.description}`,
        delay: 0.1, // 6 seconds for testing
        tag: `expense-pay-${expense.id}-${split.id}`,
        data: {
          type: 'expense-payment',
          expenseId: expense.id,
          splitId: split.id,
          amount: split.amount,
          toUser: expense.paidBy
        }
      }
    );
  }

  // If user is the creditor, calculate total amount to receive
  if (isCreditor) {
    const totalToReceive = expense.splits.reduce((sum: number, split: any) => 
      split.debtorId !== currentUser.id ? sum + split.amount : sum,
      0
    );

    if (totalToReceive > 0) {
      await scheduleNotification(
        "Payment Collection Reminder",
        {
          body: `You need to collect ₹${totalToReceive.toFixed(2)} for ${expense.description}`,
          delay: 0.2, // 12 seconds for testing
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