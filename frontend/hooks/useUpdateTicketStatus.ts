
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { updateTicketStatus } from "@/features/tickets/api";
import type { TicketStatus } from "@/features/tickets/types";

export function useUpdateTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TicketStatus) =>
      updateTicketStatus(ticketId, status),

    onSuccess: async () => {
      await Promise.all([
        // Update ticket details and activity history
        queryClient.invalidateQueries({
          queryKey: ["ticket", ticketId],
        }),

        // Update ticket list status
        queryClient.invalidateQueries({
          queryKey: ["tickets"],
        }),
      ]);
    },
  });
}
