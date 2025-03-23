"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  members: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  expenses: {
    amount: number;
  }[];
}

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch("/api/groups");
        if (response.ok) {
          const data = await response.json();
          // Sort by total expenses and take top 5 groups
          const topGroups = data
            .sort((a: Group, b: Group) => {
              const totalA = a.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
              const totalB = b.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
              return totalB - totalA;
            })
            .slice(0, 5);
          setGroups(topGroups);
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGroups();
  }, []);

  if (isLoading) {
    return <div className="text-center py-4">Loading groups...</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-4">No groups found</p>
        <Link href="/dashboard/groups">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Your Groups</h4>
        <Link href="/dashboard/groups">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {groups.map((group, index) => {
          const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map((member) => (
                    <Avatar
                      key={member.user.id}
                      className="border-2 border-background h-8 w-8"
                    >
                      <AvatarImage 
                        src={member.user.image || `https://i.pravatar.cc/150?u=${member.user.id}`}
                      />
                      <AvatarFallback>
                        {member.user.name?.[0] || 'U'}
                      </AvatarFallback>
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
                <p className="font-medium">${totalExpenses.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total expenses</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}