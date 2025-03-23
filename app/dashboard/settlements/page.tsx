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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleCreateSettlement = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(newSettlement.amount),
          description: newSettlement.description,
          groupId: newSettlement.groupId,
          fromId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create settlement");
      }

      toast.success("Settlement recorded successfully!");
      setIsOpen(false);
      setNewSettlement({ amount: "", description: "", groupId: "" });
    } catch (error) {
      console.error("Failed to create settlement:", error);
      toast.error("Failed to record settlement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/settlements");
      if (response.ok) {
        const data = await response.json();
        type Settlement = {
          date: string;
          amount: number;
          description: string | null;
          from: { name?: string; phone?: string };
          group: { name: string };
        };
        
        exportToExcel("settlements", data.map((settlement: Settlement) => ({
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