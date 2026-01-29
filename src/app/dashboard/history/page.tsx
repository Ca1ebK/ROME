"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { getPunchHistory, formatDuration, type PunchPair } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function PunchHistoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [punches, setPunches] = useState<PunchPair[]>([]);
  const [filter, setFilter] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      
      const stored = localStorage.getItem("rome_session");
      if (!stored) {
        router.push("/login");
        return;
      }
      
      const session = JSON.parse(stored);
      const days = filter === "week" ? 7 : filter === "month" ? 30 : 90;
      
      const result = await getPunchHistory(session.workerId, days);
      
      if (result.success && result.history) {
        setPunches(result.history);
      }
      
      setIsLoading(false);
    };

    loadHistory();
  }, [filter, router]);

  // Format time for display
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "--:--";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Group punches by month
  const groupByMonth = (punches: PunchPair[]) => {
    const groups: Record<string, PunchPair[]> = {};
    
    for (const punch of punches) {
      const date = new Date(punch.date);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(punch);
    }
    
    return groups;
  };

  const grouped = groupByMonth(punches);
  
  // Calculate totals
  const totalMs = punches.reduce((sum, p) => sum + p.totalMs, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-warehouse-gray-400 hover:text-warehouse-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-warehouse-white">
            Punch History
          </h1>
        </div>
        
        <button className="flex items-center gap-1 text-warehouse-orange text-sm hover:underline">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["week", "month", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-warehouse-orange text-warehouse-black"
                : "bg-warehouse-gray-800 text-warehouse-gray-400 hover:text-warehouse-white"
            )}
          >
            {f === "week" ? "This Week" : f === "month" ? "This Month" : "All Time"}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-warehouse-gray-600 border-t-warehouse-orange rounded-full animate-spin" />
        </div>
      ) : punches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warehouse-gray-500">No punch history found</p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([month, monthPunches]) => (
            <div key={month}>
              <h2 className="text-warehouse-gray-400 text-sm font-medium uppercase tracking-wide mb-3">
                {month}
              </h2>
              
              <div className="space-y-2">
                {monthPunches.map((punch) => {
                  const date = new Date(punch.date);
                  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = date.getDate();
                  
                  return (
                    <div
                      key={punch.date}
                      className="bg-warehouse-gray-800 rounded-xl p-4 border border-warehouse-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-warehouse-gray-500 text-xs uppercase">
                              {dayName}
                            </div>
                            <div className="text-warehouse-white text-lg font-bold">
                              {dayNum}
                            </div>
                          </div>
                          
                          <div className="border-l border-warehouse-gray-700 pl-4">
                            <div className="text-warehouse-white text-sm">
                              <span className="text-warehouse-success">IN</span>{" "}
                              {formatTime(punch.clockIn)}
                            </div>
                            <div className="text-warehouse-white text-sm">
                              <span className="text-warehouse-error">OUT</span>{" "}
                              {formatTime(punch.clockOut)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-warehouse-white font-semibold">
                            {punch.totalMs > 0 ? formatDuration(punch.totalMs) : "--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="bg-warehouse-gray-800 rounded-xl p-4 border border-warehouse-orange/30 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-warehouse-gray-400 font-medium">
                {filter === "week" ? "Week" : filter === "month" ? "Month" : "Period"} Total
              </span>
              <span className="text-warehouse-orange text-xl font-bold">
                {formatDuration(totalMs)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
