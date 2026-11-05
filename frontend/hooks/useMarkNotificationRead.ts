
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { markNotificationRead } from "@/features/notifications/api";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId),

    onSuccess: async () => {
      // Refresh notification records and unread count
      await queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}
