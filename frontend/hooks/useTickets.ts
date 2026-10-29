
"use client";

import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";

import { getTickets } from "@/features/tickets/api";
import type { TicketListFilters } from "@/features/tickets/types";

export function useTickets(
  page: number,
  filters: TicketListFilters
) {
  return useQuery({
    queryKey: ["tickets", page, filters],
    queryFn: () => getTickets(page, filters),
    placeholderData: keepPreviousData,
  });
}
