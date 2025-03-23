"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ExpenseChart } from "@/components/expense-chart";
import { RecentExpenses } from "@/components/recent-expenses";
import { GroupList } from "@/components/group-list";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-primary">$1,234.56</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">You Owe</h3>
          <p className="text-3xl font-bold text-destructive">$234.56</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">You are Owed</h3>
          <p className="text-3xl font-bold text-green-600">$1,469.12</p>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Expense Breakdown</h3>
            <ExpenseChart />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Groups</h3>
            <GroupList />
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Expenses</h3>
          <RecentExpenses />
        </Card>
      </motion.div>
    </div>
  );
}