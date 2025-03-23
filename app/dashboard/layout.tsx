"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}