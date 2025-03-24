import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

interface Member {
  user: {
    id: string;
    name: string | null;
    phone: string;
    image: string | null;
  };
}

interface SplitMemberSelectorProps {
  members: Member[];
  selectedMembers: string[];
  onMemberSelect: (memberIds: string[]) => void;
  paidById: string;
}

export function SplitMemberSelector({
  members,
  selectedMembers,
  onMemberSelect,
  paidById,
}: SplitMemberSelectorProps) {
  const handleMemberToggle = (memberId: string) => {
    const newSelectedMembers = selectedMembers.includes(memberId)
      ? selectedMembers.filter(id => id !== memberId)
      : [...selectedMembers, memberId];
    onMemberSelect(newSelectedMembers);
  };

  return (
    <div className="space-y-4 max-h-[200px] overflow-y-auto">
      {members.map((member) => (
        <div
          key={member.user.id}
          className="flex items-center space-x-4 p-2 hover:bg-muted/50 rounded-lg"
        >
          <Checkbox
            id={`member-${member.user.id}`}
            checked={selectedMembers.includes(member.user.id)}
            onCheckedChange={() => handleMemberToggle(member.user.id)}
            disabled={member.user.id === paidById} // Payer is always included
          />
          <label
            htmlFor={`member-${member.user.id}`}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={member.user.image || `https://i.pravatar.cc/150?u=${member.user.id}`}
              />
              <AvatarFallback>
                {member.user.name?.[0] || member.user.phone[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.user.name || member.user.phone}</p>
              {member.user.id === paidById && (
                <p className="text-xs text-muted-foreground">Paid the bill</p>
              )}
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}