"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { checkNotificationPermission, scheduleNotification } from "@/lib/notifications";
import { toast } from "sonner";

interface NotificationButtonProps {
  title: string;
  message: string;
  delay?: number; // Delay in minutes
  tag?: string;
}

export function NotificationButton({ 
  title, 
  message, 
  delay = 5,
  tag 
}: NotificationButtonProps) {
  const [isScheduling, setIsScheduling] = useState(false);

  const handleClick = async () => {
    setIsScheduling(true);
    try {
      const hasPermission = await checkNotificationPermission();
      if (!hasPermission) {
        toast.error("Please enable notifications to receive reminders");
        return;
      }

      await scheduleNotification(title, {
        body: message,
        delay,
        tag
      });

      toast.success(`Reminder scheduled for ${delay} minutes from now`);
    } catch (error) {
      toast.error("Failed to schedule notification");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isScheduling}
    >
      <Bell className="w-4 h-4 mr-2" />
      {isScheduling ? "Scheduling..." : "Remind Me"}
    </Button>
  );
}