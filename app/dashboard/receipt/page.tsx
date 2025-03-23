"use client";

import { motion } from "framer-motion";
import { ReceiptGenerator } from "@/components/receipt-generator";

export default function ReceiptPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Daily Receipt</h1>
        <p className="text-muted-foreground">
          View and manage your daily expense receipts
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ReceiptGenerator />
      </motion.div>
    </div>
  );
}