"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Settlement {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  from: {
    id: string;
    name: string | null;
    phone: string;
    image: string | null;
  };
  group: {
    id: string;
    name: string;
  };
}

export function SettlementList() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const response = await fetch("/api/settlements");
      if (response.ok) {
        const data = await response.json();
        setSettlements(data);
      }
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading settlements...
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No settlements found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Paid By</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.map((settlement, index) => (
            <motion.tr
              key={settlement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                {settlement.description}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={
                        settlement.from.image ||
                        `https://i.pravatar.cc/150?u=${settlement.from.id}`
                      }
                    />
                    <AvatarFallback>
                      {settlement.from.name?.[0] || settlement.from.phone[0]}
                    </AvatarFallback>
                  </Avatar>
                  {settlement.from.name || settlement.from.phone}
                </div>
              </TableCell>
              <TableCell>{settlement.group.name}</TableCell>
              <TableCell>
                {format(new Date(settlement.date), 'MM/dd/yyyy')}
              </TableCell>
              <TableCell className="text-right">
                ${settlement.amount.toFixed(2)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}