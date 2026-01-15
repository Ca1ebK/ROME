"use client";

import { useState } from "react";
import { UserPlus, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddWorkerProps {
  isLoading: boolean;
  onSubmit: (pin: string, name: string, role: string) => void;
  onBack: () => void;
}

export function AddWorker({ isLoading, onSubmit, onBack }: AddWorkerProps) {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("worker");
  const [error, setError] = useState<string | null>(null);

  const handlePinChange = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setError(null);
  };

  const handleSubmit = () => {
    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSubmit(pin, name.trim(), role);
  };

  const isValid = pin.length === 6 && name.trim().length > 0;

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-warehouse-orange/20 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-warehouse-orange" />
        </div>
        <h2 className="text-2xl font-bold text-warehouse-white">
          Add New Worker
        </h2>
        <p className="text-warehouse-gray-400 text-sm mt-1">
          Create a new worker account with a 6-digit PIN
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Name Input */}
        <div>
          <label className="block text-warehouse-gray-400 text-sm font-medium mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Enter worker's full name"
            disabled={isLoading}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-warehouse-gray-800 text-warehouse-white text-lg",
              "border-2 border-warehouse-gray-600",
              "focus:border-warehouse-orange focus:outline-none",
              "placeholder:text-warehouse-gray-500",
              "disabled:opacity-50"
            )}
          />
        </div>

        {/* PIN Input */}
        <div>
          <label className="block text-warehouse-gray-400 text-sm font-medium mb-2">
            6-Digit PIN
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            placeholder="000000"
            disabled={isLoading}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-warehouse-gray-800 text-warehouse-white text-lg font-mono tracking-widest text-center",
              "border-2 border-warehouse-gray-600",
              "focus:border-warehouse-orange focus:outline-none",
              "placeholder:text-warehouse-gray-500",
              "disabled:opacity-50"
            )}
          />
          <p className="text-warehouse-gray-500 text-xs mt-1">
            This PIN will be used to clock in/out
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-warehouse-gray-400 text-sm font-medium mb-2">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("worker")}
              disabled={isLoading}
              className={cn(
                "py-3 px-4 rounded-xl font-medium transition-all",
                role === "worker"
                  ? "bg-warehouse-orange text-warehouse-black"
                  : "bg-warehouse-gray-800 text-warehouse-gray-300 border border-warehouse-gray-600"
              )}
            >
              Worker
            </button>
            <button
              type="button"
              onClick={() => setRole("supervisor")}
              disabled={isLoading}
              className={cn(
                "py-3 px-4 rounded-xl font-medium transition-all",
                role === "supervisor"
                  ? "bg-warehouse-orange text-warehouse-black"
                  : "bg-warehouse-gray-800 text-warehouse-gray-300 border border-warehouse-gray-600"
              )}
            >
              Supervisor
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-warehouse-error/20 border border-warehouse-error rounded-lg">
            <p className="text-warehouse-error text-sm font-medium text-center">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className={cn(
            "flex items-center justify-center gap-3 py-4 rounded-xl",
            "text-lg font-bold transition-all",
            isValid && !isLoading
              ? "bg-warehouse-success text-warehouse-black hover:bg-green-600"
              : "bg-warehouse-gray-800 text-warehouse-gray-500 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-warehouse-black/30 border-t-warehouse-black rounded-full animate-spin" />
          ) : (
            <Check className="w-6 h-6" />
          )}
          <span>{isLoading ? "Creating..." : "Create Worker"}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center gap-2 py-3",
            "text-warehouse-gray-400 font-medium",
            "hover:text-warehouse-white transition-colors",
            "rounded-xl border border-warehouse-gray-700 hover:border-warehouse-gray-500"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}
