import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ============================================
// Demo Mode - Works without Supabase
// ============================================

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Demo workers for testing without Supabase (mutable for adding new workers)
let DEMO_WORKERS = [
  { id: "demo-1", pin: "123456", full_name: "John Smith", role: "worker" },
  { id: "demo-2", pin: "234567", full_name: "Maria Garcia", role: "worker" },
  { id: "demo-3", pin: "345678", full_name: "James Wilson", role: "supervisor" },
  { id: "demo-4", pin: "456789", full_name: "Sarah Johnson", role: "worker" },
  { id: "demo-5", pin: "567890", full_name: "Michael Brown", role: "worker" },
];

// Track demo state in memory (includes clock-in time for time tracking)
const demoState: Record<string, { isClockedIn: boolean; clockInTime: string | null }> = {};

// Simulate network delay for realistic demo
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Supabase Client (only created if configured)
// ============================================

let supabase: SupabaseClient<Database> | null = null;

if (!DEMO_MODE) {
  supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Log mode on startup
if (typeof window !== "undefined") {
  if (DEMO_MODE) {
    console.log("🎭 ROME running in DEMO MODE - no Supabase connection");
    console.log("📌 Test PINs: 123456, 234567, 345678, 456789, 567890");
    console.log("🔧 Admin PIN: 000000 (to add new workers)");
  } else {
    console.log("🚀 ROME connected to Supabase");
  }
}

// ============================================
// Time Formatting Helpers
// ============================================

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

// ============================================
// Worker Operations
// ============================================

export async function authenticateWorker(pin: string) {
  // Special admin PIN for adding workers
  if (pin === "000000") {
    return {
      success: true,
      worker: { id: "admin", full_name: "Administrator", role: "admin" },
      isAdmin: true,
    };
  }

  // Demo mode
  if (DEMO_MODE) {
    await delay(500);
    const worker = DEMO_WORKERS.find((w) => w.pin === pin);
    if (!worker) {
      return { success: false, error: "Invalid PIN. Please try again." };
    }
    return { 
      success: true, 
      worker: { id: worker.id, full_name: worker.full_name, role: worker.role },
      isAdmin: false,
    };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("workers")
    .select("id, full_name, role")
    .eq("pin", pin)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid PIN. Please try again." };
  }

  return { success: true, worker: data, isAdmin: false };
}

export async function getWorkerStatus(workerId: string) {
  // Demo mode
  if (DEMO_MODE) {
    await delay(200);
    const state = demoState[workerId];
    return { 
      isClockedIn: state?.isClockedIn ?? false, 
      clockInTime: state?.clockInTime ?? null,
      lastPunch: null,
    };
  }

  // Supabase mode - get last IN punch to calculate time
  const { data, error } = await supabase!
    .from("punches")
    .select("type, timestamp")
    .eq("worker_id", workerId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { isClockedIn: false, clockInTime: null, lastPunch: null };
  }

  // If clocked in, get the clock-in time
  let clockInTime = null;
  if (data.type === "IN") {
    clockInTime = data.timestamp;
  }

  return {
    isClockedIn: data.type === "IN",
    clockInTime,
    lastPunch: data,
  };
}

// ============================================
// Punch Operations
// ============================================

export async function clockIn(workerId: string) {
  const clockInTime = new Date().toISOString();
  
  // Demo mode
  if (DEMO_MODE) {
    await delay(600);
    demoState[workerId] = { isClockedIn: true, clockInTime };
    return { 
      success: true, 
      punch: { id: "demo-punch", worker_id: workerId, type: "IN" as const, timestamp: clockInTime },
    };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("punches")
    .insert({
      worker_id: workerId,
      type: "IN",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to clock in. Please try again." };
  }

  return { success: true, punch: data };
}

export async function clockOut(workerId: string, clockInTime: string | null) {
  const clockOutTime = new Date();
  
  // Calculate time worked
  let timeWorkedMs = 0;
  let timeWorkedFormatted = "Unknown";
  
  if (clockInTime) {
    const clockIn = new Date(clockInTime);
    timeWorkedMs = clockOutTime.getTime() - clockIn.getTime();
    timeWorkedFormatted = formatDuration(timeWorkedMs);
  }
  
  // Demo mode
  if (DEMO_MODE) {
    await delay(600);
    demoState[workerId] = { isClockedIn: false, clockInTime: null };
    return { 
      success: true, 
      punch: { id: "demo-punch", worker_id: workerId, type: "OUT" as const, timestamp: clockOutTime.toISOString() },
      timeWorked: timeWorkedFormatted,
      timeWorkedMs,
    };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("punches")
    .insert({
      worker_id: workerId,
      type: "OUT",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to clock out. Please try again." };
  }

  return { success: true, punch: data, timeWorked: timeWorkedFormatted, timeWorkedMs };
}

// ============================================
// Worker Management (Admin)
// ============================================

export async function createWorker(pin: string, fullName: string, role: string = "worker") {
  // Validate PIN
  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: "PIN must be exactly 6 digits." };
  }
  
  if (!fullName.trim()) {
    return { success: false, error: "Name is required." };
  }

  // Demo mode
  if (DEMO_MODE) {
    await delay(600);
    
    // Check if PIN already exists
    if (DEMO_WORKERS.some((w) => w.pin === pin)) {
      return { success: false, error: "This PIN is already in use." };
    }
    
    const newWorker = {
      id: `demo-${Date.now()}`,
      pin,
      full_name: fullName.trim(),
      role,
    };
    
    DEMO_WORKERS = [...DEMO_WORKERS, newWorker];
    console.log("👤 New worker added:", newWorker);
    
    return { success: true, worker: newWorker };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("workers")
    .insert({
      pin,
      full_name: fullName.trim(),
      role,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This PIN is already in use." };
    }
    return { success: false, error: "Failed to create worker. Please try again." };
  }

  return { success: true, worker: data };
}

// ============================================
// Production Log Operations
// ============================================

export type ProductionEntry = {
  taskName: string;
  quantity: number;
};

export async function logProduction(workerId: string, entries: ProductionEntry[]) {
  // Filter out entries with 0 quantity
  const validEntries = entries.filter((e) => e.quantity > 0);

  if (validEntries.length === 0) {
    return { success: false, error: "No tasks to log. Please add quantities." };
  }

  // Demo mode
  if (DEMO_MODE) {
    await delay(800);
    console.log("📦 Demo production logged:", validEntries);
    return { 
      success: true, 
      logs: validEntries.map((e, i) => ({
        id: `demo-log-${i}`,
        worker_id: workerId,
        task_name: e.taskName,
        quantity: e.quantity,
        timestamp: new Date().toISOString(),
      }))
    };
  }

  // Supabase mode
  const insertData = validEntries.map((entry) => ({
    worker_id: workerId,
    task_name: entry.taskName,
    quantity: entry.quantity,
  }));

  const { data, error } = await supabase!
    .from("production_logs")
    .insert(insertData)
    .select();

  if (error) {
    return { success: false, error: "Failed to log production. Please try again." };
  }

  return { success: true, logs: data };
}
