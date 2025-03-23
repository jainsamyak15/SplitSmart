"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  FOOD: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ENTERTAINMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TRANSPORT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SHOPPING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UTILITIES: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  RENT: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface ExpenseListProps {
  groupId?: string;
}

interface Expense {
  id: string;
  description: string;
  category: string;
  paidBy: {
    id: string;
    name?: string;
    phone: string;
    image?: string;
  };
  group: {
    name: string;
  };
  date: string;
  amount: number;
  splits?: {
    amount: number;
    debtor: {
      id: string;
      name?: string;
      phone: string;
    };
  }[];
}

export function ExpenseList({ groupId }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id || "");
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [groupId]);

  const fetchExpenses = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const url = groupId ? `/api/groups/${groupId}/expenses` : "/api/expenses";
      const response = await fetch(url, {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        const error = await response.json();
        console.error("Failed to fetch expenses:", error);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId
        }
      });

      if (response.ok) {
        toast.success("Expense deleted successfully");
        fetchExpenses(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        <div className="animate-pulse">Loading expenses...</div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
        <p>No expenses found.</p>
        <p className="text-sm mt-2">Start by adding your first expense!</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {expenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <h3 className="font-medium line-clamp-1">{expense.description}</h3>
                  <Badge variant="secondary" className={categoryColors[expense.category]}>
                    {expense.category}
                  </Badge>
                </div>
                <div className="flex items-start gap-2">
                  <p className="font-semibold text-lg">
                    ₹{expense.amount.toFixed(2)}
                  </p>
                  {expense.paidBy.id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={expense.paidBy.image || `https://i.pravatar.cc/150?u=${expense.paidBy.id}`}
                  />
                  <AvatarFallback>
                    {expense.paidBy.name?.[0] || expense.paidBy.phone[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Paid by {expense.paidBy.name || expense.paidBy.phone}
                </span>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{expense.group.name}</span>
                <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
              </div>

              {expense.splits && expense.splits.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Split with:</p>
                  <div className="flex flex-wrap gap-2">
                    {expense.splits.map((split) => (
                      <div
                        key={split.debtor.id}
                        className="text-xs px-2 py-1 bg-muted rounded-full"
                      >
                        {split.debtor.name || split.debtor.phone}: ₹{split.amount.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Paid By</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense, index) => (
            <motion.tr
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group hover:bg-muted/50"
            >
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={categoryColors[expense.category]}
                >
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={expense.paidBy.image || `https://i.pravatar.cc/150?u=${expense.paidBy.id}`}
                    />
                    <AvatarFallback>
                      {expense.paidBy.name?.[0] || expense.paidBy.phone[0]}
                    </AvatarFallback>
                  </Avatar>
                  {expense.paidBy.name || expense.paidBy.phone}
                </div>
              </TableCell>
              <TableCell>{expense.group.name}</TableCell>
              <TableCell>
                {format(new Date(expense.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right font-medium">
                ₹{expense.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                {expense.paidBy.id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}