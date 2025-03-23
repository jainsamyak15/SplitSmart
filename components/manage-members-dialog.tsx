"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  phone: string;
  image: string | null;
}

interface GroupMember {
  user: User;
  role: "ADMIN" | "MEMBER";
}

interface ManageMembersDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMembers: GroupMember[];
}

export function ManageMembersDialog({
  groupId,
  open,
  onOpenChange,
  currentMembers,
}: ManageMembersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    // Only select non-admin members by default
    setSelectedUsers(
      currentMembers
        .filter(member => member.role === "MEMBER")
        .map(member => member.user.id)
    );
  }, [currentMembers]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUser.id
        },
        body: JSON.stringify({ members: selectedUsers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update group members");
      }

      toast.success("Group members updated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update members:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update group members");
    } finally {
      setIsSaving(false);
    }
  };

  const adminMembers = currentMembers.filter(member => member.role === "ADMIN");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Group Members</DialogTitle>
          <DialogDescription>
            Select users to add to the group or unselect to remove them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {/* Show admin members first (disabled and always checked) */}
              {adminMembers.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center space-x-4 p-2 bg-muted/50 rounded-lg"
                >
                  <Checkbox
                    checked={true}
                    disabled
                  />
                  <Avatar>
                    <AvatarImage
                      src={member.user.image || `https://i.pravatar.cc/150?u=${member.user.id}`}
                    />
                    <AvatarFallback>
                      {member.user.name?.[0] || member.user.phone[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user.name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{member.user.phone}</p>
                    <span className="text-xs text-primary">Admin</span>
                  </div>
                </div>
              ))}

              {/* Show other users */}
              {users
                .filter(user => !adminMembers.some(admin => admin.user.id === user.id))
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-4 p-2 hover:bg-muted/50 rounded-lg"
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        setSelectedUsers(
                          checked
                            ? [...selectedUsers, user.id]
                            : selectedUsers.filter((id) => id !== user.id)
                        );
                      }}
                    />
                    <Avatar>
                      <AvatarImage
                        src={user.image || `https://i.pravatar.cc/150?u=${user.id}`}
                      />
                      <AvatarFallback>
                        {user.name?.[0] || user.phone[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
          <Button 
            className="w-full" 
            onClick={handleSave} 
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}