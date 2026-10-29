
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/features/dashboard/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
