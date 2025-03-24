"use client";

import { useEffect } from "react";
import { scheduleExpenseNotification } from "@/lib/notifications";

interface ExpenseNotificationProps {
  expense: any; // Using any to handle various expense structures
}

export function ExpenseNotification({ expense }: ExpenseNotificationProps) {
  useEffect(() => {
    if (expense) {
      scheduleExpenseNotification(expense).catch(console.error);
    }
  }, [expense]);

  return null; // This is a utility component that doesn't render anything
}