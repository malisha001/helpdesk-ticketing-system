"use client";

import { useQuery } from "@tanstack/react-query";
import { getTicketById } from "../features/tickets/api";

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicketById(ticketId),
  });
}
