"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, SplitSquareVertical, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showSmsNotification, setShowSmsNotification] = useState(false);
  const [mockOtp, setMockOtp] = useState("");
  const router = useRouter();

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/auth0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowOtp(true);
        if (data.otp) {
          setMockOtp(data.otp);
          setShowSmsNotification(true);
          setTimeout(() => setShowSmsNotification(false), 5000);
        }
        toast.success("OTP sent to your phone number!");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/auth0", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("Login successful!");
        router.push("/dashboard");
      } else {
        const data = await response.json();
        toast.error(data.error || "Invalid OTP");
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <AnimatePresence>
        {showSmsNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 right-4 z-50 bg-card shadow-lg rounded-lg p-4 max-w-sm border"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">New Message</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Your SplitSmart verification code is:
                </p>
                <p className="font-mono text-lg font-bold tracking-wider">{mockOtp}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center"
        >
          <SplitSquareVertical className="w-16 h-16 mx-auto mb-8 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Welcome to SplitSmart</h1>
          <p className="text-muted-foreground mb-8">
            Split expenses with friends and family beautifully
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-sm mx-auto space-y-4"
        >
          <div className="space-y-2">
            <Input
              type="tel"
              placeholder="Enter your 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-center"
              disabled={showOtp}
              maxLength={10}
            />
            {showOtp && (
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center"
                maxLength={6}
              />
            )}
            <Button
              className="w-full"
              onClick={showOtp ? handleLogin : handleSendOtp}
              disabled={(!showOtp && !phone) || (showOtp && !otp) || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showOtp ? "Verifying..." : "Sending OTP..."}
                </>
              ) : (
                showOtp ? "Login" : "Send OTP"
              )}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <Feature
            title="Smart Splitting"
            description="Split bills fairly with intelligent calculations"
          />
          <Feature
            title="Real-time Sync"
            description="Stay updated with instant expense notifications"
          />
          <Feature
            title="Beautiful Analytics"
            description="Visualize your spending patterns with charts"
          />
        </motion.div>
      </div>
    </main>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-6 rounded-lg bg-card shadow-lg"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}