
"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { updateUserStatus } from "@/features/users/api";

interface UpdateUserStatusPayload {
  userId: number;
  isActive: boolean;
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      isActive,
    }: UpdateUserStatusPayload) =>
      updateUserStatus(userId, isActive),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-users"],
      });
    },
  });
}
