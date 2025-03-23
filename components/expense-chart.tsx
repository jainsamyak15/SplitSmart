"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface ExpenseData {
  name: string;
  value: number;
}

export function ExpenseChart() {
  const [data, setData] = useState<ExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartHeight, setChartHeight] = useState(300);

  useEffect(() => {
    // Adjust chart height based on screen width
    function handleResize() {
      const width = window.innerWidth;
      setChartHeight(width < 640 ? 250 : 300);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          
          const categoryTotals = expenses.reduce((acc: Record<string, number>, expense: any) => {
            const category = expense.category;
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
          }, {});

          const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
            name: category,
            value: amount as number
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
    return <div className="flex items-center justify-center h-[250px] sm:h-[300px]">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[250px] sm:h-[300px]">No expense data available</div>;
  }

  return (
    <div className="w-full h-[250px] sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={chartHeight * 0.25}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: window.innerWidth < 640 ? '10px' : '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}