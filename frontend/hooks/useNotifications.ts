
"use client";

import { useQuery } from "@tanstack/react-query";

import { getNotifications } from "@/features/notifications/api";

export function useNotifications(page: number = 1) {
  return useQuery({
    queryKey: ["notifications", page],
    queryFn: () => getNotifications(page),

    staleTime: 30 * 1000,

    // Fallback if a WebSocket event is missed
    refetchInterval: 30 * 1000,

    // Refresh when returning to the browser tab
    refetchOnWindowFocus: "always",

    // Refresh when browser networking returns
    refetchOnReconnect: "always",

    retry: 1,
  });
}
