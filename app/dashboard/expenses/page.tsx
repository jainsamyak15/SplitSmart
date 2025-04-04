"use client";

import { useState, useEffect, createContext, useContext } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SplitMemberSelector } from "@/components/split-member-selector";
import { ExpenseNotification } from "@/components/expense-notification";
import { toast } from "sonner";
import { ExpenseUpdateContext } from "@/context/ExpenseUpdateContext";

const categories = [
  { value: "FOOD", label: "Food" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "OTHER", label: "Other" },
];

interface Group {
  id: string;
  name: string;
  members: {
    user: {
      id: string;
      name: string | null;
      phone: string;
      image: string | null;
    };
  }[];
}

export default function ExpensesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [lastCreatedExpense, setLastCreatedExpense] = useState<any>(null);
  const [expenseUpdateCount, setExpenseUpdateCount] = useState(0);

  // Function to trigger expense list refresh
  const triggerExpenseUpdate = () => {
    setExpenseUpdateCount(prev => prev + 1);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id || "");
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedGroup) {
      const group = groups.find(g => g.id === selectedGroup);
      if (group) {
        setSelectedMembers([currentUserId]);
      }
    }
  }, [selectedGroup, groups, currentUserId]);

  const fetchGroups = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return;

      const response = await fetch("/api/groups", {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to fetch groups");
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast.error("Failed to fetch groups");
    }
  };
  
  const handleCreateExpense = async () => {
    try {
      setIsLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const totalAmount = parseFloat(newExpense.amount);
      const splitAmount = totalAmount / selectedMembers.length;

      const splits = selectedMembers.map(memberId => ({
        userId: memberId,
        amount: splitAmount
      }));
      
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'x-user-id': user.id
        },
        body: JSON.stringify({
          amount: totalAmount,
          description: newExpense.description,
          category: newExpense.category,
          groupId: selectedGroup,
          paidById: user.id,
          date: new Date().toISOString(),
          splits: splits
        }),
      });

      if (response.ok) {
        const createdExpense = await response.json();
        setLastCreatedExpense(createdExpense);
        toast.success("Expense added successfully!");
        setIsOpen(false);
        setNewExpense({ description: "", amount: "", category: "" });
        setSelectedGroup("");
        setSelectedMembers([]);
        
        // Trigger update to expense list
        triggerExpenseUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Failed to create expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGroupMembers = selectedGroup
    ? groups.find(g => g.id === selectedGroup)?.members || []
    : [];

  return (
    <ExpenseUpdateContext.Provider value={{ 
      triggerUpdate: triggerExpenseUpdate, 
      lastUpdate: expenseUpdateCount 
    }}>
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
                    placeholder="Enter expense description"
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
                    placeholder="Enter amount"
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

                {selectedGroup && (
                  <div className="space-y-2">
                    <Label>Split With</Label>
                    <SplitMemberSelector
                      members={selectedGroupMembers}
                      selectedMembers={selectedMembers}
                      onMemberSelect={setSelectedMembers}
                      paidById={currentUserId}
                    />
                    {selectedMembers.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Splitting ₹{newExpense.amount || '0'} between {selectedMembers.length} people
                        (₹{newExpense.amount ? (parseFloat(newExpense.amount) / selectedMembers.length).toFixed(2) : '0'} each)
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCreateExpense}
                  disabled={
                    !newExpense.description || 
                    !newExpense.amount || 
                    !newExpense.category || 
                    !selectedGroup || 
                    selectedMembers.length === 0 ||
                    isLoading
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Expense"
                  )}
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

        {lastCreatedExpense && (
          <ExpenseNotification 
            expense={lastCreatedExpense} 
            isNewExpense={true}
          />
        )}
      </div>
    </ExpenseUpdateContext.Provider>
  );
}