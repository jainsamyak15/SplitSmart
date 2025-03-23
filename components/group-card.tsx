"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, Receipt, Settings, Trash, Plus } from "lucide-react";
import { ManageMembersDialog } from "@/components/manage-members-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GroupMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    phone: string;
    image: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
  expenses: any[];
}

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const [showManageMembers, setShowManageMembers] = useState(false);
  const router = useRouter();
  const totalExpenses = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  // Check if current user is an admin
  const isAdmin = group.members.some(member => 
    member.user.id === currentUser.id && member.role === "ADMIN"
  );

  const handleDeleteGroup = async () => {
    if (!confirm("Are you sure you want to delete this group?")) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "DELETE",
        headers: {
          'x-user-id': currentUser.id
        }
      });

      if (response.ok) {
        toast.success("Group deleted successfully!");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">{group.name}</h3>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/groups/${group.id}/expenses`}>
                  <Receipt className="w-4 h-4 mr-2" />
                  View Expenses
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => setShowManageMembers(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/groups/${group.id}/settings`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDeleteGroup}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Group
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 flex justify-between items-end">
          <div className="flex -space-x-2">
            {group.members.map((member) => (
              <Avatar
                key={member.id}
                className="border-2 border-background"
              >
                <AvatarImage 
                  src={member.user.image || `https://i.pravatar.cc/150?u=${member.user.id}`} 
                />
                <AvatarFallback>
                  {member.user.name?.[0] || member.user.phone[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {isAdmin && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-10 w-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center cursor-pointer"
                onClick={() => setShowManageMembers(true)}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <ManageMembersDialog
          groupId={group.id}
          open={showManageMembers}
          onOpenChange={setShowManageMembers}
          currentMembers={group.members}
        />
      )}
    </>
  );
}