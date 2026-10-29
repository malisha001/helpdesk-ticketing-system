
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { sendTicketReply } from "@/features/tickets/api";

export function useSendTicketReply(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      sendTicketReply(ticketId, message),

    onSuccess: async () => {
      // Refresh this ticket's details and conversation
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ticket", ticketId],
        }),

        // Refresh the ticket list if needed
        queryClient.invalidateQueries({
          queryKey: ["tickets"],
        }),
      ]);
    },
  });
}
