import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface Activity {
  id: string;
  type: "create" | "update" | "delete";
  entity: "department" | "category" | "indicator" | "monthlyData" | "patientCase";
  entityId: number;
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: Record<string, any>;
}

export function useRealtimeSync(onActivityUpdate?: (activity: Activity) => void) {
  const lastSyncRef = useRef(new Date());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling interval in milliseconds
  const POLL_INTERVAL = 2000; // 2 seconds for real-time feel

  const startPolling = useCallback(() => {
    // Poll for activity updates every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      const now = new Date();
      // In a real implementation, you would query for activities since lastSyncRef.current
      lastSyncRef.current = now;
    }, POLL_INTERVAL);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return {
    lastSync: lastSyncRef.current,
    startPolling,
    stopPolling,
  };
}

// Hook for broadcasting changes to other users
export function useBroadcastChange() {
  const broadcastChange = useCallback((activity: Activity) => {
    // Store activity in localStorage for other tabs/windows
    const activities = JSON.parse(localStorage.getItem("kpi-activities") || "[]");
    activities.push({
      ...activity,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 activities
    if (activities.length > 50) {
      activities.shift();
    }

    localStorage.setItem("kpi-activities", JSON.stringify(activities));

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent("kpi-activity", {
        detail: activity,
      })
    );
  }, []);

  return { broadcastChange };
}

// Hook for listening to activity updates
export function useActivityListener(onActivity?: (activity: Activity) => void) {
  useEffect(() => {
    const handleActivity = (event: Event) => {
      const customEvent = event as CustomEvent<Activity>;
      if (onActivity) {
        onActivity(customEvent.detail);
      }
    };

    window.addEventListener("kpi-activity", handleActivity);
    return () => window.removeEventListener("kpi-activity", handleActivity);
  }, [onActivity]);
}
