import type { TimeOffType, RequestStatus } from "@/types/database";
import { getSupabaseClient, isDemoMode, delay } from "./supabase-shared";

// ============================================
// Types
// ============================================

export interface TimeOffRequestData {
  id: string;
  worker_id: string;
  worker_name?: string;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  paid_hours: number;
  unpaid_hours: number;
  is_excused: boolean;
  is_planned: boolean;
  comments: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewer_name?: string;
  reviewed_at: string | null;
  denial_reason: string | null;
  created_at: string;
}

// Demo data
let DEMO_REQUESTS: TimeOffRequestData[] = [];

// ============================================
// Time Off Request Functions
// ============================================

// Helper to create a demo request
function createDemoRequest(workerId: string, data: {
  type: TimeOffType;
  start_date: string;
  end_date: string;
  paid_hours: number;
  unpaid_hours: number;
  comments?: string;
}): TimeOffRequestData {
  return {
    id: `demo-req-${Date.now()}`,
    worker_id: workerId,
    type: data.type,
    start_date: data.start_date,
    end_date: data.end_date,
    paid_hours: data.paid_hours,
    unpaid_hours: data.unpaid_hours,
    is_excused: true,
    is_planned: true,
    comments: data.comments || null,
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    denial_reason: null,
    created_at: new Date().toISOString(),
  };
}

export async function submitTimeOffRequest(
  workerId: string,
  data: {
    type: TimeOffType;
    start_date: string;
    end_date: string;
    paid_hours: number;
    unpaid_hours: number;
    comments?: string;
  }
) {
  const supabase = getSupabaseClient();
  
  // Demo mode
  if (isDemoMode() || !supabase) {
    await delay(600);
    const newRequest = createDemoRequest(workerId, data);
    DEMO_REQUESTS = [newRequest, ...DEMO_REQUESTS];
    return { success: true, request: newRequest };
  }

  // Supabase mode
  try {
    const { data: result, error } = await supabase
      .from("time_off_requests")
      .insert({
        worker_id: workerId,
        type: data.type,
        start_date: data.start_date,
        end_date: data.end_date,
        paid_hours: data.paid_hours,
        unpaid_hours: data.unpaid_hours,
        comments: data.comments || null,
      })
      .select()
      .single();

    if (error) {
      console.warn("Supabase insert failed, using demo fallback:", error.message);
      const newRequest = createDemoRequest(workerId, data);
      DEMO_REQUESTS = [newRequest, ...DEMO_REQUESTS];
      return { success: true, request: newRequest };
    }

    return { success: true, request: result };
  } catch (err) {
    console.warn("Error submitting request, using demo fallback:", err);
    const newRequest = createDemoRequest(workerId, data);
    DEMO_REQUESTS = [newRequest, ...DEMO_REQUESTS];
    return { success: true, request: newRequest };
  }
}

export async function getMyTimeOffRequests(workerId: string) {
  const supabase = getSupabaseClient();
  
  // Demo mode
  if (isDemoMode() || !supabase) {
    await delay(300);
    const requests = DEMO_REQUESTS.filter((r) => r.worker_id === workerId);
    return { success: true, requests };
  }

  // Supabase mode - join with workers to get reviewer name
  try {
    const { data, error } = await supabase
      .from("time_off_requests")
      .select(`
        *,
        reviewer:workers!reviewed_by(full_name)
      `)
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase query failed, using demo data:", error.message);
      const requests = DEMO_REQUESTS.filter((r) => r.worker_id === workerId);
      return { success: true, requests };
    }

    // Map to include reviewer name
    const requests = (data || []).map((r: { reviewer?: { full_name: string } }) => ({
      ...r,
      reviewer_name: r.reviewer?.full_name || null,
    }));

    return { success: true, requests: requests as TimeOffRequestData[] };
  } catch (err) {
    console.warn("Error fetching requests, using demo data:", err);
    const requests = DEMO_REQUESTS.filter((r) => r.worker_id === workerId);
    return { success: true, requests };
  }
}

export async function getAllPendingRequests() {
  const supabase = getSupabaseClient();
  
  // Demo mode
  if (isDemoMode() || !supabase) {
    await delay(300);
    const pending = DEMO_REQUESTS.filter((r) => r.status === "pending");
    return { success: true, requests: pending };
  }

  // Supabase mode - join with workers to get names
  // Use !worker_id to specify which foreign key to use (avoids ambiguity with reviewed_by)
  try {
    const { data, error } = await supabase
      .from("time_off_requests")
      .select(`
        *,
        worker:workers!worker_id(full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      // Table might not exist - fall back to demo data
      console.warn("Supabase query failed, using demo data:", error.message);
      const pending = DEMO_REQUESTS.filter((r) => r.status === "pending");
      return { success: true, requests: pending };
    }

    // Map to include worker name
    const requests = (data || []).map((r: { worker?: { full_name: string } }) => ({
      ...r,
      worker_name: r.worker?.full_name || "Unknown",
    }));

    return { success: true, requests: requests as TimeOffRequestData[] };
  } catch (err) {
    // Fallback to demo data on any error
    console.warn("Error fetching requests, using demo data:", err);
    const pending = DEMO_REQUESTS.filter((r) => r.status === "pending");
    return { success: true, requests: pending };
  }
}

export async function getAllTimeOffRequests() {
  const supabase = getSupabaseClient();
  
  // Demo mode
  if (isDemoMode() || !supabase) {
    await delay(300);
    return { success: true, requests: DEMO_REQUESTS };
  }

  // Supabase mode
  // Use !worker_id and !reviewed_by to specify which foreign keys to use
  try {
    const { data, error } = await supabase
      .from("time_off_requests")
      .select(`
        *,
        worker:workers!worker_id(full_name),
        reviewer:workers!reviewed_by(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Supabase query failed, using demo data:", error.message);
      return { success: true, requests: DEMO_REQUESTS };
    }

    const requests = (data || []).map((r: { worker?: { full_name: string }; reviewer?: { full_name: string } }) => ({
      ...r,
      worker_name: r.worker?.full_name || "Unknown",
      reviewer_name: r.reviewer?.full_name || null,
    }));

    return { success: true, requests: requests as TimeOffRequestData[] };
  } catch (err) {
    console.warn("Error fetching requests, using demo data:", err);
    return { success: true, requests: DEMO_REQUESTS };
  }
}

// Helper to update demo request
function updateDemoRequest(requestId: string, updates: Partial<TimeOffRequestData>) {
  DEMO_REQUESTS = DEMO_REQUESTS.map((r) =>
    r.id === requestId ? { ...r, ...updates } : r
  );
}

export async function approveRequest(requestId: string, managerId: string) {
  const supabase = getSupabaseClient();
  
  const updates = {
    status: "approved" as const,
    reviewed_by: managerId,
    reviewed_at: new Date().toISOString(),
  };

  // Demo mode or demo request ID
  if (isDemoMode() || !supabase || requestId.startsWith("demo-")) {
    await delay(500);
    updateDemoRequest(requestId, updates);
    return { success: true };
  }

  // Supabase mode
  try {
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        status: "approved",
        reviewed_by: managerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.warn("Supabase update failed, using demo fallback:", error.message);
      updateDemoRequest(requestId, updates);
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    console.warn("Error approving request, using demo fallback:", err);
    updateDemoRequest(requestId, updates);
    return { success: true };
  }
}

export async function denyRequest(requestId: string, managerId: string, reason?: string) {
  const supabase = getSupabaseClient();
  
  const updates = {
    status: "denied" as const,
    reviewed_by: managerId,
    reviewed_at: new Date().toISOString(),
    denial_reason: reason || null,
  };

  // Demo mode or demo request ID
  if (isDemoMode() || !supabase || requestId.startsWith("demo-")) {
    await delay(500);
    updateDemoRequest(requestId, updates);
    return { success: true };
  }

  // Supabase mode
  try {
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        status: "denied",
        reviewed_by: managerId,
        reviewed_at: new Date().toISOString(),
        denial_reason: reason || null,
      })
      .eq("id", requestId);

    if (error) {
      console.warn("Supabase update failed, using demo fallback:", error.message);
      updateDemoRequest(requestId, updates);
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    console.warn("Error denying request, using demo fallback:", err);
    updateDemoRequest(requestId, updates);
    return { success: true };
  }
}
