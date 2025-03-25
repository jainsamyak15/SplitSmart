"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SettlementList } from "@/components/settlement-list";
import { exportToExcel } from "@/lib/export";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PendingSplit {
  id: string;
  amount: number;
  expense: {
    id: string;
    description: string;
    date: string;
    group: {
      id: string;
      name: string;
    };
  };
  creditor: {
    id: string;
    name: string | null;
    phone: string;
  };
}

export default function SettlementsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [newSettlement, setNewSettlement] = useState({
    amount: "",
    description: "",
    groupId: "",
  });
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [pendingSplits, setPendingSplits] = useState<PendingSplit[]>([]);
  const [selectedSplits, setSelectedSplits] = useState<string[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user.id || "");
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (currentUserId && isOpen) {
      fetchGroups();
      fetchPendingSplits();
    }
  }, [currentUserId, isOpen]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups", {
        headers: {
          'x-user-id': currentUserId
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch groups");
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast.error("Failed to fetch groups");
    }
  };

  const fetchPendingSplits = async () => {
    try {
      const response = await fetch("/api/expenses", {
        headers: {
          'x-user-id': currentUserId
        }
      });
      
      if (response.ok) {
        const expenses = await response.json();
        const pendingSplits: PendingSplit[] = [];
        
        expenses.forEach((expense: any) => {
          expense.splits.forEach((split: any) => {
            // Only show splits where the current user is the debtor (owes money)
            // and the creditor (person who paid) is someone else
            if (split.debtorId === currentUserId && 
                split.creditorId !== currentUserId && 
                !split.settled) {
              pendingSplits.push({
                id: split.id,
                amount: split.amount,
                expense: {
                  id: expense.id,
                  description: expense.description,
                  date: expense.date,
                  group: {
                    id: expense.group.id,
                    name: expense.group.name
                  }
                },
                creditor: expense.paidBy
              });
            }
          });
        });
        
        setPendingSplits(pendingSplits);
      }
    } catch (error) {
      console.error("Failed to fetch pending splits:", error);
      toast.error("Failed to fetch pending splits");
    }
  };

  const handleCreateSettlement = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      // For split-based settlements, use the group ID from the first selected split
      const groupId = selectedSplits.length > 0
        ? pendingSplits.find(split => split.id === selectedSplits[0])?.expense.group.id
        : newSettlement.groupId;

      if (!groupId) {
        throw new Error("No group selected");
      }
      
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'x-user-id': user.id
        },
        body: JSON.stringify({
          amount: parseFloat(newSettlement.amount),
          description: newSettlement.description || "Settlement for expenses",
          groupId: groupId,
          fromId: user.id,
          splitIds: selectedSplits
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create settlement");
      }

      toast.success("Settlement recorded successfully!");
      setIsOpen(false);
      setNewSettlement({ amount: "", description: "", groupId: "" });
      setSelectedSplits([]);
      fetchPendingSplits();
    } catch (error) {
      console.error("Failed to create settlement:", error);
      toast.error(error instanceof Error ? error.message : "Failed to record settlement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/settlements", {
        headers: {
          'x-user-id': currentUserId
        }
      });
      if (response.ok) {
        const data = await response.json();
        exportToExcel("settlements", data.map((settlement: any) => ({
          date: new Date(settlement.date).toLocaleDateString(),
          amount: settlement.amount,
          description: settlement.description,
          from: settlement.from.name || settlement.from.phone,
          group: settlement.group.name,
        })));
        toast.success("Settlements exported successfully!");
      }
    } catch (error) {
      console.error("Failed to export settlements:", error);
      toast.error("Failed to export settlements");
    }
  };

  const handleSplitSelect = (splitId: string, amount: number) => {
    setSelectedSplits(prev => {
      const newSelection = prev.includes(splitId)
        ? prev.filter(id => id !== splitId)
        : [...prev, splitId];
      
      // Update settlement amount based on selected splits
      const totalAmount = pendingSplits
        .filter(split => newSelection.includes(split.id))
        .reduce((sum, split) => sum + split.amount, 0);
      
      setNewSettlement(prev => ({
        ...prev,
        amount: totalAmount.toString()
      }));
      
      return newSelection;
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
          <p className="text-muted-foreground">Manage and track settlements</p>
        </div>

        <div className="flex w-full sm:w-auto gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="flex-1 sm:flex-none justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            {isMobile ? "Export" : "Export to Excel"}
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none justify-center">
                <Plus className="w-4 h-4 mr-2" />
                {isMobile ? "New" : "New Settlement"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Settlement</DialogTitle>
                <DialogDescription>
                  Record a payment settlement between group members.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="splits" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="splits">From Splits</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="splits">
                  <div className="space-y-4 py-4">
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {pendingSplits.length === 0 ? (
                        <p className="text-center text-muted-foreground">No pending splits found</p>
                      ) : (
                        pendingSplits.map((split) => (
                          <Card key={split.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{split.expense.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  To: {split.creditor.name || split.creditor.phone}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Group: {split.expense.group.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="font-semibold">₹{split.amount.toFixed(2)}</p>
                                <input
                                  type="checkbox"
                                  checked={selectedSplits.includes(split.id)}
                                  onChange={() => handleSplitSelect(split.id, split.amount)}
                                  className="h-4 w-4"
                                />
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                    {selectedSplits.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          value={newSettlement.description}
                          onChange={(e) =>
                            setNewSettlement({ ...newSettlement, description: e.target.value })
                          }
                          placeholder="Enter description"
                        />
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleCreateSettlement}
                      disabled={selectedSplits.length === 0 || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        `Settle Selected (₹${parseFloat(newSettlement.amount || "0").toFixed(2)})`
                      )}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="manual">
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newSettlement.amount}
                        onChange={(e) =>
                          setNewSettlement({ ...newSettlement, amount: e.target.value })
                        }
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newSettlement.description}
                        onChange={(e) =>
                          setNewSettlement({ ...newSettlement, description: e.target.value })
                        }
                        placeholder="Enter description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group">Group</Label>
                      <Select
                        value={newSettlement.groupId}
                        onValueChange={(value) =>
                          setNewSettlement({ ...newSettlement, groupId: value })
                        }
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
                      onClick={handleCreateSettlement}
                      disabled={!newSettlement.amount || !newSettlement.description || !newSettlement.groupId || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        "Record Settlement"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-4 sm:p-6">
          <SettlementList />
        </Card>
      </motion.div>
    </div>
  );
}