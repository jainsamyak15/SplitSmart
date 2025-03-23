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

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: {
    name: string | null;
    avatar: string | null;
    id: string;
  };
}

export function RecentExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const response = await fetch("/api/expenses");
        if (response.ok) {
          const data = await response.json();
          // Sort by date and take the most recent 5 expenses
          const recentExpenses = data
            .sort((a: Expense, b: Expense) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .slice(0, 5);
          setExpenses(recentExpenses);
        }
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenses();
  }, []);

  if (isLoading) {
    return <div className="text-center py-4">Loading expenses...</div>;
  }

  if (expenses.length === 0) {
    return <div className="text-center py-4">No recent expenses found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Paid By</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
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
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={expense.paidBy.avatar || `https://i.pravatar.cc/150?u=${expense.paidBy.id}`} 
                    />
                    <AvatarFallback>
                      {expense.paidBy.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {expense.paidBy.name || 'Unknown'}
                </div>
              </TableCell>
              <TableCell>{expense.category}</TableCell>
              <TableCell className="text-right">
                ${expense.amount.toFixed(2)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}