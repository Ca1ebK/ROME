"use client";

import { useEffect, useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWorkerStatus, getWeeklyHours, getPunchHistory, formatDuration, type PunchPair } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Session {
  workerId: string;
  workerName: string;
}

export default function DashboardHome() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data state
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [weeklyHours, setWeeklyHours] = useState({ totalHours: 0, dailyHours: {} as Record<string, number> });
  const [recentPunches, setRecentPunches] = useState<PunchPair[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load session
  useEffect(() => {
    const stored = localStorage.getItem("rome_session");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSession({ workerId: parsed.workerId, workerName: parsed.workerName });
    }
  }, []);

  // Load data when session is available
  useEffect(() => {
    if (!session) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get clock status
        const status = await getWorkerStatus(session.workerId);
        setIsClockedIn(status.isClockedIn);
        setClockInTime(status.clockInTime);

        // Get weekly hours
        const weekly = await getWeeklyHours(session.workerId);
        setWeeklyHours(weekly);

        // Get recent punches
        const history = await getPunchHistory(session.workerId, 7);
        if (history.success && history.history) {
          setRecentPunches(history.history.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate current session time
  const getCurrentSessionTime = () => {
    if (!isClockedIn || !clockInTime) return null;
    const start = new Date(clockInTime);
    const ms = currentTime.getTime() - start.getTime();
    return formatDuration(ms);
  };

  // Format time for display
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "--:--";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Days of week
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-warehouse-gray-600 border-t-warehouse-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* This Week Card */}
      <div className="bg-warehouse-gray-800 rounded-xl p-4 border border-warehouse-gray-700">
        <h2 className="text-warehouse-gray-400 text-sm font-medium uppercase tracking-wide mb-3">
          This Week
        </h2>
        
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-bold text-warehouse-white">
            {weeklyHours.totalHours.toFixed(1)}
          </span>
          <span className="text-warehouse-gray-400 text-lg mb-1">hrs</span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-warehouse-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-warehouse-orange rounded-full transition-all duration-500"
            style={{ width: `${Math.min((weeklyHours.totalHours / 40) * 100, 100)}%` }}
          />
        </div>

        {/* Daily breakdown */}
        <div className="flex justify-between">
          {weekDays.map((day) => (
            <div key={day} className="text-center">
              <div className="text-warehouse-gray-500 text-xs mb-1">{day}</div>
              <div className="text-warehouse-white text-sm font-medium">
                {weeklyHours.dailyHours[day]?.toFixed(1) || "--"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today Card */}
      <div className="bg-warehouse-gray-800 rounded-xl p-4 border border-warehouse-gray-700">
        <h2 className="text-warehouse-gray-400 text-sm font-medium uppercase tracking-wide mb-3">
          Today
        </h2>

        <div className="space-y-3">
          {/* Clock In Status */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isClockedIn ? "bg-warehouse-success animate-pulse" : "bg-warehouse-gray-500"
            )} />
            <span className="text-warehouse-white">
              {isClockedIn ? "Clocked In" : "Not clocked in"}
            </span>
            <span className="text-warehouse-gray-400 ml-auto">
              {isClockedIn ? formatTime(clockInTime) : "--:--"}
            </span>
          </div>

          {/* Clock Out Status */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-warehouse-gray-500" />
            <span className="text-warehouse-gray-400">
              {isClockedIn ? "Not yet" : "Clocked Out"}
            </span>
            <span className="text-warehouse-gray-400 ml-auto">--:--</span>
          </div>

          {/* Current session */}
          {isClockedIn && (
            <div className="pt-2 border-t border-warehouse-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warehouse-orange" />
                <span className="text-warehouse-gray-400">Currently working:</span>
                <span className="text-warehouse-orange font-semibold ml-auto">
                  {getCurrentSessionTime()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Punches Card */}
      <div className="bg-warehouse-gray-800 rounded-xl p-4 border border-warehouse-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-warehouse-gray-400 text-sm font-medium uppercase tracking-wide">
            Recent Punches
          </h2>
          <button
            onClick={() => router.push("/dashboard/history")}
            className="flex items-center gap-1 text-warehouse-orange text-sm hover:underline"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentPunches.length === 0 ? (
          <p className="text-warehouse-gray-500 text-sm text-center py-4">
            No recent punches
          </p>
        ) : (
          <div className="space-y-3">
            {recentPunches.map((punch) => (
              <div
                key={punch.date}
                className="flex items-center justify-between py-2 border-b border-warehouse-gray-700 last:border-0"
              >
                <div>
                  <div className="text-warehouse-white text-sm font-medium">
                    {formatDate(punch.date)}
                  </div>
                  <div className="text-warehouse-gray-400 text-xs">
                    <span className="text-warehouse-success">IN</span>{" "}
                    {formatTime(punch.clockIn)}
                    {punch.clockOut && (
                      <>
                        {" → "}
                        <span className="text-warehouse-error">OUT</span>{" "}
                        {formatTime(punch.clockOut)}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-warehouse-white text-sm font-medium">
                  {punch.totalMs > 0 ? formatDuration(punch.totalMs) : "--"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick action - Go to kiosk */}
      <div className="text-center pt-4">
        <p className="text-warehouse-gray-500 text-sm">
          Need to clock in or out?{" "}
          <a href="/kiosk" className="text-warehouse-orange hover:underline">
            Use the kiosk →
          </a>
        </p>
      </div>
    </div>
  );
}
