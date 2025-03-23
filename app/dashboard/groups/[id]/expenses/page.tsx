"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ExpenseList } from "@/components/expense-list";

export default function GroupExpensesPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      }
    } catch (error) {
      console.error("Failed to fetch group:", error);
    }
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{group.name} - Expenses</h1>
        <p className="text-muted-foreground">
          View and manage expenses for this group
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <ExpenseList groupId={groupId} />
        </Card>
      </motion.div>
    </div>
  );
}