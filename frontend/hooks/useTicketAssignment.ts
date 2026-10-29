
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  assignTicket,
  reassignTicket,
} from "@/features/tickets/api";

interface TicketAssignmentInput {
  agentId: number;
  action: "assign" | "reassign";
}

export function useTicketAssignment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      action,
    }: TicketAssignmentInput) => {
      if (action === "assign") {
        return assignTicket(ticketId, agentId);
      }

      return reassignTicket(ticketId, agentId);
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ticket", ticketId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["tickets"],
        }),
      ]);
    },
  });
}
