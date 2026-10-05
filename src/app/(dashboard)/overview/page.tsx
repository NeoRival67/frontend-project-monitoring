"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/use-cases/hooks/useAuth";
import { DashboardOverview } from "@/presentation/features/DashboardOverview";

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Admin tidak boleh melihat dashboard overview
  if (user?.role === "ADMIN") {
    return (
      <div className="w-full py-20 text-center">
        <div className="max-w-md mx-auto p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ✕
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Role Admin tidak memiliki izin untuk melihat dashboard overview. Silakan gunakan menu Master User & Tim atau Client / Vendor.
          </p>
          <button 
            onClick={() => router.push("/master-tim")} 
            className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            Buka Master Data
          </button>
        </div>
      </div>
    );
  }

  return <DashboardOverview />;
}
