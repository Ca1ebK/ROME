"use client";

import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  isLoading?: boolean;
  error?: string | null;
}

export function NumericKeypad({
  value,
  onChange,
  onSubmit,
  maxLength = 6,
  isLoading = false,
  error = null,
}: NumericKeypadProps) {
  const hasAutoSubmitted = useRef(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handleDigitPress = (digit: string) => {
    if (value.length < maxLength && !isLoading) {
      // Flash the pressed key
      setPressedKey(digit);
      setTimeout(() => setPressedKey(null), 150);
      
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (!isLoading) {
      setPressedKey("backspace");
      setTimeout(() => setPressedKey(null), 150);
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isLoading) {
      setPressedKey("clear");
      setTimeout(() => setPressedKey(null), 150);
      onChange("");
    }
  };

  // Keyboard input support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if loading
      if (isLoading) return;

      // Number keys (both main keyboard and numpad)
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      }
      // Backspace or Delete
      else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value, isLoading, maxLength]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (value.length === maxLength && !isLoading && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      // Small delay for visual feedback
      const timer = setTimeout(() => {
        onSubmit();
      }, 150);
      return () => clearTimeout(timer);
    }
    
    // Reset auto-submit flag when value changes (e.g., after error clears PIN)
    if (value.length < maxLength) {
      hasAutoSubmitted.current = false;
    }
  }, [value, maxLength, isLoading, onSubmit]);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* PIN Display */}
      <div className="flex flex-col items-center gap-3 w-full">
        <p className="text-warehouse-gray-400 text-base font-medium tracking-wide uppercase">
          Enter Your PIN
        </p>
        <div className="flex gap-2">
          {Array.from({ length: maxLength }).map((_, i) => {
            const isFilled = i < value.length;
            
            return (
              <div
                key={i}
                className={cn(
                  "pin-digit transition-all duration-150",
                  isFilled && "pin-digit-filled"
                )}
              >
                {isFilled ? (
                  <span className="text-warehouse-orange">●</span>
                ) : (
                  <span className="text-warehouse-gray-600">○</span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 px-4 py-2 bg-warehouse-error/20 border border-warehouse-error rounded-lg animate-shake">
            <p className="text-warehouse-error text-sm font-medium text-center">
              {error}
            </p>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-2 flex items-center gap-2 text-warehouse-gray-400">
            <div className="w-5 h-5 border-2 border-warehouse-gray-600 border-t-warehouse-orange rounded-full animate-spin" />
            <span className="text-sm">Verifying...</span>
          </div>
        )}
      </div>

      {/* Keypad Grid - Scaled smaller */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {/* Digits 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigitPress(digit.toString())}
            disabled={isLoading || value.length >= maxLength}
            className={cn(
              "keypad-button-sm aspect-square transition-all duration-100",
              pressedKey === digit.toString() && "keypad-button-pressed"
            )}
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading || value.length === 0}
          className={cn(
            "keypad-button-sm aspect-square text-warehouse-gray-400 !text-lg transition-all duration-100",
            pressedKey === "clear" && "keypad-button-pressed"
          )}
        >
          CLR
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleDigitPress("0")}
          disabled={isLoading || value.length >= maxLength}
          className={cn(
            "keypad-button-sm aspect-square transition-all duration-100",
            pressedKey === "0" && "keypad-button-pressed"
          )}
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          disabled={isLoading || value.length === 0}
          className={cn(
            "keypad-button-sm aspect-square transition-all duration-100",
            pressedKey === "backspace" && "keypad-button-pressed"
          )}
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-warehouse-gray-600 text-xs text-center">
        You can also type with your keyboard
      </p>
    </div>
  );
}
