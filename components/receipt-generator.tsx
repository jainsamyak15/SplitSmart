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

            // Store original styles
            const receiptElement = receiptRef.current;
            const originalStyles = {
                width: receiptElement.style.width,
                maxWidth: receiptElement.style.maxWidth,
                height: receiptElement.style.height,
                overflow: receiptElement.style.overflow,
                position: receiptElement.style.position
            };

            // Set fixed width for consistent PDF generation
            receiptElement.style.width = "600px";
            receiptElement.style.maxWidth = "600px";
            receiptElement.style.height = "auto";
            receiptElement.style.overflow = "visible";
            receiptElement.style.position = "relative";

            // Create canvas from the receipt element
            const canvas = await html2canvas(receiptElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: "#ffffff",
                windowWidth: 1200,
                // Force canvas to capture full height
                height: receiptElement.scrollHeight,
                onclone: (clonedDoc, clonedElement) => {
                    clonedElement.style.height = `${receiptElement.scrollHeight}px`;
                    clonedElement.style.position = "relative";
                    clonedElement.style.overflow = "visible";
                },
            });

            // Restore original styles
            receiptElement.style.width = originalStyles.width;
            receiptElement.style.maxWidth = originalStyles.maxWidth;
            receiptElement.style.height = originalStyles.height;
            receiptElement.style.overflow = originalStyles.overflow;
            receiptElement.style.position = originalStyles.position;

            // Define PDF dimensions with A4 paper size in mind
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Convert canvas to image data URL
            const imgData = canvas.toDataURL("image/jpeg");

            // Initialize heightLeft and position for pagination
            let heightLeft = imgHeight;
            let position = 0;
            let pageCount = 0;
            
            // Create new PDF with proper orientation
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });
            
            // Replace the SVG stamp code with this approach:
            // Create a temporary canvas to render the stamp
            const stampCanvas = document.createElement('canvas');
            stampCanvas.width = 200;
            stampCanvas.height = 200;
            const stampCtx = stampCanvas.getContext('2d');

            // Draw the stamp on the canvas
            if (stampCtx) {
            // Set background color to transparent
            stampCtx.clearRect(0, 0, 200, 200);

            // Draw outer serrated edge
            stampCtx.beginPath();
            stampCtx.fillStyle = '#cc0000';
            
            // Draw a serrated circle
            const centerX = 100;
            const centerY = 100;
            const outerRadius = 90;
            const pointCount = 24; // Number of points in the serrated edge
            const innerRadius = 85;
            
            for (let i = 0; i < pointCount * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 * i) / (pointCount * 2);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                if (i === 0) {
                stampCtx.moveTo(x, y);
                } else {
                stampCtx.lineTo(x, y);
                }
            }
            
            stampCtx.closePath();
            stampCtx.fill();
            
            // Draw white circles
            stampCtx.strokeStyle = '#ffffff';
            stampCtx.lineWidth = 3;
            stampCtx.beginPath();
            stampCtx.arc(centerX, centerY, 70, 0, Math.PI * 2);
            stampCtx.stroke();
            
            stampCtx.lineWidth = 2;
            stampCtx.beginPath();
            stampCtx.arc(centerX, centerY, 55, 0, Math.PI * 2);
            stampCtx.stroke();
            
            // Draw curved "THANK YOU" text at top
            stampCtx.save();
            stampCtx.font = 'bold 12px Arial';
            stampCtx.fillStyle = '#ffffff';
            stampCtx.textAlign = 'center';
            stampCtx.textBaseline = 'middle';
            
            // Draw top curved "THANK YOU"
            stampCtx.save();
            const topTextRadius = 62;
            const topStartAngle = -Math.PI / 3; // -60 degrees
            const topEndAngle = -2 * Math.PI / 3; // -120 degrees
            const topTextLength = "THANK YOU".length;
            
            for (let i = 0; i < topTextLength; i++) {
                const charAngle = topStartAngle + (topEndAngle - topStartAngle) * (i / (topTextLength - 1));
                stampCtx.save();
                stampCtx.translate(
                centerX + topTextRadius * Math.cos(charAngle),
                centerY + topTextRadius * Math.sin(charAngle)
                );
                stampCtx.rotate(charAngle + Math.PI / 2); // Adjust for text orientation
                stampCtx.fillText("UOY KNAHT"[i], 0, 0);
                stampCtx.restore();
            }
            stampCtx.restore();
            
            // Draw bottom curved "THANK YOU"
            stampCtx.save();
            const bottomTextRadius = 62;
            const bottomStartAngle = Math.PI / 3.5; // 60 degrees
            const bottomEndAngle = 2 * Math.PI / 3; // 120 degrees
            const bottomTextLength = "THANK YOU".length;
            
            for (let i = 0; i < bottomTextLength; i++) {
                const charAngle = bottomStartAngle + (bottomEndAngle - bottomStartAngle) * (i / (bottomTextLength - 1));
                stampCtx.save();
                stampCtx.translate(
                centerX + bottomTextRadius * Math.cos(charAngle),
                centerY + bottomTextRadius * Math.sin(charAngle)
                );
                stampCtx.rotate(charAngle + Math.PI / 2); // Adjust for text orientation
                stampCtx.fillText("THANK YOU"[i], 0, 0);
                stampCtx.restore();
            }
            stampCtx.restore();
            
            // Add PAID text in center
            stampCtx.font = 'bold 16px Arial';
            stampCtx.textAlign = 'center';
            stampCtx.textBaseline = 'middle';
            stampCtx.fillText('SPLITSMART', centerX, centerY);
            
            // Add decorative dots
            [45, 65, 85, 155, 135, 115].forEach((angle) => {
                const dotRadius = 3;
                const dotDistance = 80;
                const dotX = centerX + dotDistance * Math.cos((angle * Math.PI) / 180);
                const dotY = centerY + dotDistance * Math.sin((angle * Math.PI) / 180);
                
                stampCtx.beginPath();
                stampCtx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                stampCtx.fill();
            });
            
            stampCtx.restore();
            }

            // Convert canvas to PNG data URL
            const stampDataUrl = stampCanvas.toDataURL('image/png');

            // Then use this stampDataUrl in your code where you were using the SVG data URL
            const addStampToPage = () => {
            // Position the stamp in the top-right quadrant of the page
            pdf.addImage(
                stampDataUrl, 
                'PNG',  // Change this from 'SVG' to 'PNG'
                90, // X position (from right side)
                180,  // Y position (from top)
                50,  // Width of stamp
                50   // Height of stamp
            );
            };
            
            // First page
            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
            addStampToPage(); // Add stamp to first page
            heightLeft -= pageHeight;
            pageCount++;
            
            // Add additional pages if needed
            while (heightLeft > 0) {
                position = -(pageCount * pageHeight); // Move to show next portion
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                addStampToPage(); // Add stamp to each additional page
                heightLeft -= pageHeight;
                pageCount++;
            }
            
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
                className="space-y-6 p-6 bg-background relative"
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