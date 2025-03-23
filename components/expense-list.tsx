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

const categoryColors: Record<string, string> = {
  FOOD: "bg-red-100 text-red-800",
  ENTERTAINMENT: "bg-purple-100 text-purple-800",
  TRANSPORT: "bg-blue-100 text-blue-800",
  SHOPPING: "bg-green-100 text-green-800",
  UTILITIES: "bg-yellow-100 text-yellow-800",
  RENT: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
};

interface ExpenseListProps {
  groupId?: string;
}

export function ExpenseList({ groupId }: ExpenseListProps) {
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
  }

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [groupId]);

  const fetchExpenses = async () => {
    try {
      const url = groupId ? `/api/groups/${groupId}/expenses` : "/api/expenses";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading expenses...
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expenses found.
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
                    <AvatarImage src={expense.paidBy.image || `https://i.pravatar.cc/150?u=${expense.paidBy.id}`} />
                    <AvatarFallback>
                      {expense.paidBy.name?.[0] || expense.paidBy.phone[0]}
                    </AvatarFallback>
                  </Avatar>
                  {expense.paidBy.name || expense.paidBy.phone}
                </div>
              </TableCell>
              <TableCell>{expense.group.name}</TableCell>
              <TableCell>
                {format(new Date(expense.date), 'MM/dd/yyyy')}
              </TableCell>
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