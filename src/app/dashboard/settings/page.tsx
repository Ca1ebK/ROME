"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  workerId: string;
  workerName: string;
  email: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("rome_session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("rome_session");
    router.push("/login");
  };

  const maskPin = (pin: string = "000000") => {
    return "●●●●" + pin.slice(-2);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-warehouse-gray-600 border-t-warehouse-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Card */}
      <div className="bg-warehouse-gray-800 rounded-xl p-4 border border-warehouse-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-warehouse-orange/20 flex items-center justify-center">
            <User className="w-8 h-8 text-warehouse-orange" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-warehouse-white">
              {session.workerName}
            </h2>
            <p className="text-warehouse-gray-400 text-sm">Worker</p>
            <p className="text-warehouse-gray-500 text-xs mt-1">
              PIN: {maskPin()}
            </p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div>
        <h3 className="text-warehouse-gray-400 text-sm font-medium uppercase tracking-wide mb-3">
          Account
        </h3>
        <div className="bg-warehouse-gray-800 rounded-xl border border-warehouse-gray-700 divide-y divide-warehouse-gray-700">
          {/* Email */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-warehouse-gray-500" />
              <div>
                <p className="text-warehouse-gray-400 text-sm">Email</p>
                <p className="text-warehouse-white">{session.email}</p>
              </div>
            </div>
            <button className="text-warehouse-orange text-sm hover:underline">
              Edit
            </button>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-warehouse-gray-500" />
              <div>
                <p className="text-warehouse-gray-400 text-sm">Phone</p>
                <p className="text-warehouse-gray-500">Not set</p>
              </div>
            </div>
            <button className="text-warehouse-orange text-sm hover:underline">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div>
        <h3 className="text-warehouse-gray-400 text-sm font-medium uppercase tracking-wide mb-3">
          Notifications
        </h3>
        <div className="bg-warehouse-gray-800 rounded-xl border border-warehouse-gray-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-warehouse-gray-500" />
              <span className="text-warehouse-white">Email notifications</span>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                emailNotifications ? "bg-warehouse-orange" : "bg-warehouse-gray-600"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white absolute top-1 transition-all",
                  emailNotifications ? "right-1" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 rounded-xl",
          "bg-warehouse-gray-800 text-warehouse-error font-semibold",
          "border border-warehouse-gray-700",
          "hover:bg-warehouse-gray-700 transition-colors"
        )}
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>

      {/* App Info */}
      <div className="text-center pt-4">
        <p className="text-warehouse-gray-600 text-xs">
          ROME v1.0.0 • Scholastic Warehouse
        </p>
      </div>
    </div>
  );
}
