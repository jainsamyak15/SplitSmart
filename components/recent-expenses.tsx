"use client";

import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const recentExpenses = [
  {
    id: 1,
    description: "Dinner at Restaurant",
    amount: 120.50,
    paidBy: {
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?u=john",
    },
    date: "2024-03-20",
    category: "Food",
  },
  {
    id: 2,
    description: "Movie Tickets",
    amount: 45.00,
    paidBy: {
      name: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?u=jane",
    },
    date: "2024-03-19",
    category: "Entertainment",
  },
  {
    id: 3,
    description: "Uber Ride",
    amount: 25.75,
    paidBy: {
      name: "Mike Johnson",
      avatar: "https://i.pravatar.cc/150?u=mike",
    },
    date: "2024-03-18",
    category: "Transport",
  },
];

export function RecentExpenses() {
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
          {recentExpenses.map((expense, index) => (
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
                    <AvatarImage src={expense.paidBy.avatar} />
                    <AvatarFallback>
                      {expense.paidBy.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {expense.paidBy.name}
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