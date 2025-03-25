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
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setCurrentUserId(user.id || "");
    }, []);

    useEffect(() => {
        fetchReceiptData();
    }, [currentUserId, selectedDate]);

    const fetchReceiptData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (!user.id) {
                setIsLoading(false);
                return;
            }

            const expensesResponse = await fetch("/api/expenses", {
                headers: {
                    "x-user-id": user.id,
                },
            });

            if (!expensesResponse.ok) throw new Error("Failed to fetch expenses");
            const expenses = await expensesResponse.json();

            // Filter expenses for the selected date
            const selectedDateExpenses = expenses.filter((expense: any) => {
                const expenseDate = new Date(expense.date);
                return expenseDate.toDateString() === selectedDate.toDateString();
            });

            const receipt: Receipt = {
                date: format(selectedDate, "MMMM d, yyyy"),
                totalExpenses: selectedDateExpenses.reduce(
                    (sum: number, exp: any) => sum + exp.amount,
                    0
                ),
                paidExpenses: selectedDateExpenses
                    .filter((exp: any) => exp.paidById === user.id)
                    .map((exp: any) => ({
                        description: exp.description,
                        amount: exp.amount,
                        group: exp.group.name,
                    })),
                pendingPayments: selectedDateExpenses
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
                receivablePayments: selectedDateExpenses
                    .filter((exp: any) => exp.paidById === user.id)
                    .flatMap((exp: any) =>
                        exp.splits
                            .filter((split: any) => split.debtorId !== user.id && !split.settled)
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
            toast.info("Generating PDF...");

            const originalWidth = receiptRef.current.style.width;
            const originalMaxWidth = receiptRef.current.style.maxWidth;

            receiptRef.current.style.width = "600px";
            receiptRef.current.style.maxWidth = "600px";

            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: "#ffffff",
                windowWidth: 1200,
            });

            receiptRef.current.style.width = originalWidth;
            receiptRef.current.style.maxWidth = originalMaxWidth;

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: imgHeight > imgWidth ? "portrait" : "landscape",
                unit: "mm",
                format: "a4",
            });

            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
            pdf.save(`expense-receipt-${format(selectedDate, "yyyy-MM-dd")}.pdf`);

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
                text:
                    `Daily Expense Summary (${receipt.date})\n` +
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

    return (
        <div className="space-y-6 px-4 md:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold">Daily Expense Receipt</h2>
                <div className="flex w-full sm:w-auto gap-2">
                    {/* Date selector */}
                    <input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <Button
                        variant="outline"
                        onClick={shareReceipt}
                        className="flex-1 sm:flex-initial justify-center"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button
                        onClick={downloadAsPDF}
                        className="flex-1 sm:flex-initial justify-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Download PDF</span>
                    </Button>
                </div>
            </div>

            <div
                ref={receiptRef}
                className="space-y-6 p-6 bg-background"
                style={{ minWidth: "280px" }}
            >
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold">Expense Receipt</h3>
                    <p className="text-muted-foreground">{receipt?.date}</p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">
                            Your Expenses
                        </h4>
                        {receipt?.paidExpenses.length ? (
                            <div className="space-y-3">
                                {receipt.paidExpenses.map((expense, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center py-2"
                                    >
                                        <div style={{ maxWidth: "75%" }}>
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
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">
                            Pending Payments
                        </h4>
                        {receipt?.pendingPayments.length ? (
                            <div className="space-y-3">
                                {receipt.pendingPayments.map((payment, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center py-2"
                                    >
                                        <div style={{ maxWidth: "75%" }}>
                                            <p className="font-medium">To: {payment.to}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {payment.group}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-red-500">
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
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">
                            Receivable Payments
                        </h4>
                        {receipt?.receivablePayments.length ? (
                            <div className="space-y-3">
                                {receipt.receivablePayments.map((payment, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center py-2"
                                    >
                                        <div style={{ maxWidth: "75%" }}>
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

                    <div className="pt-4 mt-6 border-t border-dashed">
                        <div className="flex justify-between items-center">
                            <p className="text-lg font-semibold">Total Expenses</p>
                            <p className="text-xl font-bold">
                                ₹{receipt?.totalExpenses.toFixed(2) || "0.00"}
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-8 pt-6 border-t text-sm text-muted-foreground">
                        <p>Generated on {format(new Date(), "PPpp")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}