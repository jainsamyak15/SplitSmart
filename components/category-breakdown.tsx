"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  category: string;
  amount: number;
}

export function CategoryBreakdown() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/expenses", {
          headers: {
            'x-user-id': user.id
          }
        });
        
        if (response.ok) {
          const expenses = await response.json();
          
          // Group expenses by category and calculate total amount
          const categoryTotals = expenses.reduce((acc: Record<string, number>, expense: any) => {
            const category = expense.category;
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
          }, {});

          // Transform data for the chart
          const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
            category,
            amount: amount as number
          }));

          setData(chartData);
        }
      } catch (error) {
        console.error("Failed to fetch expense data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-[300px]">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No expense data available</div>;
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip labelClassName="text-black" 
          itemStyle={{ color: "black" }}/>
          <Bar
            dataKey="amount"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}