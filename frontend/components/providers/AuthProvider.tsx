
"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/lib/auth";

interface AuthProviderProps {
  initialUser: AuthUser;
  children: ReactNode;
}

export default function AuthProvider({
  initialUser,
  children,
}: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Initialize TanStack Query with the server-loaded user
  const { error } = useAuth(initialUser);

  useEffect(() => {
    if (!axios.isAxiosError(error)) {
      return;
    }

    const status = error.response?.status;

    if (status === 401 || status === 403) {
      // Prevent user-specific cached data being reused
      queryClient.clear();

      router.replace("/login");
      router.refresh();
    }
  }, [error, queryClient, router]);

  return <>{children}</>;
}
