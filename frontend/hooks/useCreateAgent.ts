"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createAgent } from "@/features/users/api";

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAgent,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["support-agents"] }),
      ]);
    },
  });
}
