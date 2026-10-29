
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupportAgents } from "@/features/tickets/api";

export function useSupportAgents() {
  return useQuery({
    queryKey: ["support-agents"],
    queryFn: getSupportAgents,
    staleTime: 60 * 1000,
    retry: false,
  });
}
