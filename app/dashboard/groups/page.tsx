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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { GroupCard } from "@/components/group-card";
import { toast } from "sonner";

export default function GroupsPage() {
  const [loading1, setLoading1] = useState<boolean>(false)
  const [groups, setGroups] = useState<{ id: string; name: string; description: string; members: any[]; expenses: any[] }[]>([]);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.map((group: any) => ({
          ...group,
          members: group.members || [],
          expenses: group.expenses || [],
        })));
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast.error("Failed to load groups");
    }
  };

  const handleCreateGroup = async () => {
    try {
      setLoading1(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) {
        toast.error("Please log in to create a group");
        return;
      }

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          userId: user.id,
        }),
      });

      if (response.ok) {
        toast.success("Group created successfully!");
        setIsOpen(false);
        setNewGroup({ name: "", description: "" });
        fetchGroups(); // Refresh the groups list
        setLoading1(false)
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">Manage your expense groups</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateGroup}
                disabled={!newGroup.name || loading1}
              >
                {loading1 ? "Creating..." : "Create New Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <GroupCard group={group} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}