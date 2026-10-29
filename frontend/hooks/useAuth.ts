
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/authService";
import type { AuthUser } from "@/lib/auth";

export const authQueryKey = ["auth", "me"] as const;

export function useAuth(initialUser?: AuthUser) {
  return useQuery<AuthUser>({
    queryKey: authQueryKey,
    queryFn: getMe,

    // Reuse the user already loaded by Next.js
    initialData: initialUser,

    // Consider the data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Do not retry rejected authentication requests
    retry: false,
  });
}
