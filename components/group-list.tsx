"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const groups = [
  {
    id: 1,
    name: "Weekend Trip",
    members: [
      { name: "John", avatar: "https://i.pravatar.cc/150?u=john" },
      { name: "Jane", avatar: "https://i.pravatar.cc/150?u=jane" },
      { name: "Mike", avatar: "https://i.pravatar.cc/150?u=mike" },
    ],
    totalExpenses: 450.75,
  },
  {
    id: 2,
    name: "Roommates",
    members: [
      { name: "Sarah", avatar: "https://i.pravatar.cc/150?u=sarah" },
      { name: "Tom", avatar: "https://i.pravatar.cc/150?u=tom" },
    ],
    totalExpenses: 890.25,
  },
];

export function GroupList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Your Groups</h4>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      <div className="space-y-2">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {group.members.map((member) => (
                  <Avatar
                    key={member.name}
                    className="border-2 border-background h-8 w-8"
                  >
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <h4 className="font-medium">{group.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {group.members.length} members
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${group.totalExpenses.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total expenses</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}