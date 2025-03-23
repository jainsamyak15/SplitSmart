"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  phone: string;
  image: string | null;
}

interface SplitExpenseDialogProps {
  expenseId: string;
  amount: number;
  members: { user: User }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SplitExpenseDialog({
  expenseId,
  amount,
  members,
  open,
  onOpenChange,
}: SplitExpenseDialogProps) {
  const [splits, setSplits] = useState<{ userId: string; amount: number }[]>([]);

  useEffect(() => {
    // Initialize equal splits
    const equalAmount = amount / members.length;
    setSplits(
      members.map((member) => ({
        userId: member.user.id,
        amount: equalAmount,
      }))
    );
  }, [amount, members]);

  const handleSplit = async () => {
    try {
      const response = await fetch("/api/expenses/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseId,
          splits,
        }),
      });

      if (response.ok) {
        toast.success("Expense split successfully!");
        onOpenChange(false);
      } else {
        toast.error("Failed to split expense");
      }
    } catch (error) {
      console.error("Failed to split expense:", error);
      toast.error("Failed to split expense");
    }
  };

  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
  const isValid = Math.abs(totalSplit - amount) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {members.map((member, index) => (
              <div
                key={member.user.id}
                className="flex items-center space-x-4 p-2"
              >
                <Avatar>
                  <AvatarImage
                    src={
                      member.user.image ||
                      `https://i.pravatar.cc/150?u=${member.user.id}`
                    }
                  />
                  <AvatarFallback>
                    {member.user.name?.[0] || member.user.phone[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {member.user.name || member.user.phone}
                  </p>
                </div>
                <div className="w-32">
                  <Label htmlFor={`amount-${index}`}>Amount</Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    value={splits[index]?.amount || 0}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index].amount = parseFloat(e.target.value) || 0;
                      setSplits(newSplits);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Amount: ${amount.toFixed(2)}</span>
            <span>Split Amount: ${totalSplit.toFixed(2)}</span>
          </div>
          <Button
            className="w-full"
            onClick={handleSplit}
            disabled={!isValid}
          >
            Split Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}