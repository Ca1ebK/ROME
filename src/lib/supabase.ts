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

// ============================================
// Dashboard Authentication (PIN + Email)
// ============================================

// Demo emails for testing
const DEMO_EMAILS: Record<string, string> = {
  "demo-1": "john.smith@example.com",
  "demo-2": "maria.garcia@example.com",
  "demo-3": "james.wilson@example.com",
  "demo-4": "sarah.johnson@example.com",
  "demo-5": "michael.brown@example.com",
};

// Demo verification codes (in-memory)
const demoVerificationCodes: Record<string, { code: string; expiresAt: Date }> = {};

export async function authenticateWorkerForDashboard(pin: string) {
  // Demo mode
  if (DEMO_MODE) {
    await delay(500);
    const worker = DEMO_WORKERS.find((w) => w.pin === pin);
    if (!worker) {
      return { success: false, error: "Invalid PIN. Please try again." };
    }
    const email = DEMO_EMAILS[worker.id] || "test@example.com";
    return { 
      success: true, 
      worker: { 
        id: worker.id, 
        full_name: worker.full_name, 
        role: worker.role,
        email,
      },
    };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("workers")
    .select("id, full_name, role, email")
    .eq("pin", pin)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid PIN. Please try again." };
  }

  if (!data.email) {
    return { success: false, error: "No email registered. Please contact your manager." };
  }

  return { success: true, worker: data };
}

export async function sendVerificationCode(workerId: string, email: string) {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Demo mode
  if (DEMO_MODE) {
    await delay(500);
    demoVerificationCodes[workerId] = { code, expiresAt };
    // In demo mode, log the code to console
    console.log(`📧 Verification code for ${email}: ${code}`);
    return { success: true, message: "Code sent!" };
  }

  // Supabase mode - store code in database
  const { error } = await supabase!
    .from("verification_codes")
    .insert({
      worker_id: workerId,
      code,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    return { success: false, error: "Failed to send code. Please try again." };
  }

  // TODO: Actually send email using Resend, SendGrid, etc.
  // For now, log to console (you'll see it in Supabase logs)
  console.log(`📧 Verification code for ${email}: ${code}`);

  return { success: true, message: "Code sent!" };
}

export async function verifyCode(workerId: string, code: string) {
  // Demo mode
  if (DEMO_MODE) {
    await delay(500);
    const stored = demoVerificationCodes[workerId];
    if (!stored) {
      return { success: false, error: "No code found. Please request a new one." };
    }
    if (stored.code !== code) {
      return { success: false, error: "Invalid code. Please try again." };
    }
    if (new Date() > stored.expiresAt) {
      return { success: false, error: "Code expired. Please request a new one." };
    }
    // Clear used code
    delete demoVerificationCodes[workerId];
    return { success: true };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("verification_codes")
    .select("*")
    .eq("worker_id", workerId)
    .eq("code", code)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid code. Please try again." };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { success: false, error: "Code expired. Please request a new one." };
  }

  // Mark code as used
  await supabase!
    .from("verification_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { success: true };
}

// ============================================
// Punch History & Hours
// ============================================

export interface PunchPair {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalMs: number;
}

export async function getPunchHistory(workerId: string, days: number = 14) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Demo mode
  if (DEMO_MODE) {
    await delay(300);
    // Generate some fake punch history
    const history: PunchPair[] = [];
    for (let i = 1; i <= Math.min(days, 7); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        const clockIn = new Date(date);
        clockIn.setHours(8, Math.floor(Math.random() * 15), 0, 0);
        const clockOut = new Date(date);
        clockOut.setHours(16, Math.floor(Math.random() * 45), 0, 0);
        history.push({
          date: date.toISOString().split("T")[0],
          clockIn: clockIn.toISOString(),
          clockOut: clockOut.toISOString(),
          totalMs: clockOut.getTime() - clockIn.getTime(),
        });
      }
    }
    return { success: true, history };
  }

  // Supabase mode
  const { data, error } = await supabase!
    .from("punches")
    .select("*")
    .eq("worker_id", workerId)
    .gte("timestamp", startDate.toISOString())
    .order("timestamp", { ascending: true });

  if (error) {
    return { success: false, error: "Failed to load punch history." };
  }

  // Group punches into pairs by date
  const punchMap = new Map<string, { ins: string[]; outs: string[] }>();
  
  for (const punch of data || []) {
    const date = punch.timestamp.split("T")[0];
    if (!punchMap.has(date)) {
      punchMap.set(date, { ins: [], outs: [] });
    }
    const entry = punchMap.get(date)!;
    if (punch.type === "IN") {
      entry.ins.push(punch.timestamp);
    } else {
      entry.outs.push(punch.timestamp);
    }
  }

  const history: PunchPair[] = [];
  for (const [date, { ins, outs }] of punchMap) {
    const clockIn = ins[0] || null;
    const clockOut = outs[outs.length - 1] || null;
    let totalMs = 0;
    if (clockIn && clockOut) {
      totalMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    }
    history.push({ date, clockIn, clockOut, totalMs });
  }

  // Sort by date descending
  history.sort((a, b) => b.date.localeCompare(a.date));

  return { success: true, history };
}

export async function getWeeklyHours(workerId: string) {
  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const result = await getPunchHistory(workerId, 7);
  
  if (!result.success || !result.history) {
    return { totalMs: 0, totalHours: 0, dailyHours: {} };
  }

  let totalMs = 0;
  const dailyHours: Record<string, number> = {};

  for (const punch of result.history) {
    const punchDate = new Date(punch.date);
    if (punchDate >= startOfWeek) {
      totalMs += punch.totalMs;
      const dayName = punchDate.toLocaleDateString("en-US", { weekday: "short" });
      dailyHours[dayName] = (dailyHours[dayName] || 0) + punch.totalMs / (1000 * 60 * 60);
    }
  }

  return {
    totalMs,
    totalHours: totalMs / (1000 * 60 * 60),
    dailyHours,
  };
}
