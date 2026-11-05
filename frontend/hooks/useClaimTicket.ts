
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { claimTicket } from "@/features/tickets/api";
import { toast } from "sonner";

export function useClaimTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => claimTicket(ticketId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ticket", ticketId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["tickets"],
        }),
      ]);
      toast.success("Ticket claimed successfully");
    },
    onError: () => {
      toast.error("Failed to claim ticket");
    },
  });
}
