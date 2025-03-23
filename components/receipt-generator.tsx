"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface Receipt {
  date: string;
  totalExpenses: number;
  paidExpenses: {
    description: string;
    amount: number;
    group: string;
  }[];
  pendingPayments: {
    to: string;
    amount: number;
    group: string;
  }[];
  receivablePayments: {
    from: string;
    amount: number;
    group: string;
  }[];
}

export function ReceiptGenerator() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReceiptData();
  }, []);

  const fetchReceiptData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) {
        setIsLoading(false);
        return;
      }

      // Fetch expenses
      const expensesResponse = await fetch("/api/expenses", {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (!expensesResponse.ok) throw new Error("Failed to fetch expenses");
      const expenses = await expensesResponse.json();

      // Process data and create receipt
      const today = new Date();
      const todayExpenses = expenses.filter((expense: any) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === today.toDateString();
      });

      const receipt: Receipt = {
        date: format(today, "MMMM d, yyyy"),
        totalExpenses: todayExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        paidExpenses: todayExpenses
          .filter((exp: any) => exp.paidById === user.id)
          .map((exp: any) => ({
            description: exp.description,
            amount: exp.amount,
            group: exp.group.name,
          })),
        pendingPayments: todayExpenses
          .filter((exp: any) => exp.paidById !== user.id)
          .flatMap((exp: any) =>
            exp.splits
              .filter((split: any) => split.debtorId === user.id && !split.settled)
              .map((split: any) => ({
                to: exp.paidBy.name || exp.paidBy.phone,
                amount: split.amount,
                group: exp.group.name,
              }))
          ),
        receivablePayments: todayExpenses
          .filter((exp: any) => exp.paidById === user.id)
          .flatMap((exp: any) =>
            exp.splits
              .filter((split: any) => !split.settled)
              .map((split: any) => ({
                from: split.debtor.name || split.debtor.phone,
                amount: split.amount,
                group: exp.group.name,
              }))
          ),
      };

      setReceipt(receipt);
    } catch (error) {
      console.error("Failed to fetch receipt data:", error);
      toast.error("Failed to generate receipt");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`expense-receipt-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Failed to download receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  const shareReceipt = async () => {
    if (!receipt) return;

    try {
      const shareData = {
        title: "Expense Receipt",
        text: `Daily Expense Summary (${receipt.date})\n` +
          `Total Expenses: ₹${receipt.totalExpenses.toFixed(2)}\n` +
          `Pending Payments: ${receipt.pendingPayments.length}\n` +
          `Receivable Payments: ${receipt.receivablePayments.length}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Receipt shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast.success("Receipt details copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share receipt:", error);
      toast.error("Failed to share receipt");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No expenses found for today</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Expense Receipt</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={shareReceipt}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={downloadAsPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div ref={receiptRef} className="space-y-6 p-6 bg-background">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold">Expense Receipt</h3>
            <p className="text-muted-foreground">{receipt.date}</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Your Expenses</h4>
              {receipt.paidExpenses.length > 0 ? (
                <div className="space-y-2">
                  {receipt.paidExpenses.map((expense, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.group}
                        </p>
                      </div>
                      <p className="font-semibold">₹{expense.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No expenses today</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Pending Payments</h4>
              {receipt.pendingPayments.length > 0 ? (
                <div className="space-y-2">
                  {receipt.pendingPayments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <p className="font-medium">To: {payment.to}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.group}
                        </p>
                      </div>
                      <p className="font-semibold text-destructive">
                        ₹{payment.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No pending payments</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Receivable Payments</h4>
              {receipt.receivablePayments.length > 0 ? (
                <div className="space-y-2">
                  {receipt.receivablePayments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <p className="font-medium">From: {payment.from}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.group}
                        </p>
                      </div>
                      <p className="font-semibold text-green-600">
                        ₹{payment.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No receivable payments</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Total Expenses</p>
                <p className="text-xl font-bold">
                    ₹{receipt.totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}