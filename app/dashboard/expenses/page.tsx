"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { toast } from "sonner";

const categories = [
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "OTHER", label: "Other" },
];

export default function ExpensesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
  });
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const handleCreateExpense = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          category: newExpense.category,
          groupId: selectedGroup,
          paidById: user.id,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Expense added successfully!");
        setIsOpen(false);
        setNewExpense({ description: "", amount: "", category: "" });
        setSelectedGroup("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Failed to create expense:", error);
      toast.error("Failed to add expense");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your expenses</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) =>
                    setNewExpense({ ...newExpense, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select
                  value={selectedGroup}
                  onValueChange={setSelectedGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateExpense}
                disabled={!newExpense.description || !newExpense.amount || !newExpense.category || !selectedGroup}
              >
                Add Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <ExpenseList />
        </Card>
      </motion.div>
    </div>
  );
}