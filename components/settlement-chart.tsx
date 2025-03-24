"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface SettlementData {
  date: string;
  amount: number;
}

export function SettlementChart() {
  const [data, setData] = useState<SettlementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id || "");
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId]);

  async function fetchData() {
    try {
      const response = await fetch("/api/settlements", {
        headers: {
          'x-user-id': currentUserId
        }
      });
      
      if (response.ok) {
        const settlements = await response.json();
        
        // Group settlements by date and calculate total amount
        const dailyTotals = settlements.reduce((acc: Record<string, number>, settlement: any) => {
          const date = format(new Date(settlement.date), 'MMM d');
          acc[date] = (acc[date] || 0) + settlement.amount;
          return acc;
        }, {});

        // Transform data for the chart
        const chartData = Object.entries(dailyTotals)
          .map(([date, amount]) => ({
            date,
            amount: amount as number
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setData(chartData);
      }
    } catch (error) {
      console.error("Failed to fetch settlement data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-[300px]">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No settlement data available</div>;
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => `₹${value.toFixed(2)}`}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}