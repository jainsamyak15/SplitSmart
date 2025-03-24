'use client';

import { useEffect } from "react";
import { scheduleExpenseNotification, checkNotificationPermission } from "@/lib/notifications";
import { toast } from "sonner";

interface ExpenseNotificationProps {
  expense: any;
}

export function ExpenseNotification({ expense }: ExpenseNotificationProps) {
  useEffect(() => {
    async function setupNotifications() {
      try {
        // First check if notifications are supported and permitted
        const hasPermission = await checkNotificationPermission();
        
        if (!hasPermission) {
          toast.error("Please enable notifications in your browser settings to receive expense reminders");
          return;
        }

        // Schedule the notification
        if (expense) {
          await scheduleExpenseNotification(expense);
          toast.success("Expense notifications scheduled");
        }
      } catch (error) {
        console.error("Failed to setup notifications:", error);
        toast.error("Failed to setup notifications");
      }
    }

    setupNotifications();
  }, [expense]);

  return null;
}