"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ExpenseChart } from "@/components/expense-chart";
import { RecentExpenses } from "@/components/recent-expenses";
import { GroupList } from "@/components/group-list";

interface DashboardData {
  totalBalance: number;
  youOwe: number;
  youAreOwed: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    youOwe: 0,
    youAreOwed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          setIsLoading(false);
          return;
        }
        
        // Fetch all expenses with splits
        const response = await fetch("/api/expenses");
        if (response.ok) {
          const expenses = await response.json();
          
          let totalOwed = 0;
          let totalOwing = 0;

          // Calculate totals from splits
          expenses.forEach((expense: any) => {
            if (expense.splits) {
              expense.splits.forEach((split: any) => {
                if (split.debtorId === user.id && split.creditorId !== user.id) {
                  // You owe this amount
                  totalOwing += split.amount;
                }
                if (split.creditorId === user.id && split.debtorId !== user.id) {
                  // You are owed this amount
                  totalOwed += split.amount;
                }
              });
            }
          });

          setData({
            totalBalance: totalOwed - totalOwing,
            youOwe: totalOwing,
            youAreOwed: totalOwed
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
          <p className={`text-3xl font-bold ${data.totalBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            ${data.totalBalance.toFixed(2)}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">You Owe</h3>
          <p className="text-3xl font-bold text-destructive">
            ${data.youOwe.toFixed(2)}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">You are Owed</h3>
          <p className="text-3xl font-bold text-green-600">
            ${data.youAreOwed.toFixed(2)}
          </p>
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