
"use client";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import { getAdminUsers } from "@/features/users/api";

import type {
  AdminUsersFilters,
} from "@/features/users/types";

export function useAdminUsers(
  filters: AdminUsersFilters
) {
  return useQuery({
    queryKey: [
      "admin-users",
      filters.page,
      filters.search,
      filters.role,
      filters.is_active,
    ],

    queryFn: () => getAdminUsers(filters),

    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,
  });
}
