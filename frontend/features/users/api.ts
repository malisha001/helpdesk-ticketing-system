
import { apiClient } from "@/services/apiClient";

import type {
  AdminUsersFilters,
  AdminUsersResponse,
  CreateAgentPayload,
  CreateAgentResponse,
} from "./types";

export async function getAdminUsers(
  filters: AdminUsersFilters
): Promise<AdminUsersResponse> {
  const response = await apiClient.get<AdminUsersResponse>(
    "/users",
    {
      params: {
        page: filters.page,
        search: filters.search || undefined,
        role: filters.role || undefined,
        is_active: filters.is_active === "" ? undefined : filters.is_active,
      },
    }
  );

  return response.data;
}

export async function updateUserStatus(
  userId: number,
  isActive: boolean
): Promise<void> {
  await apiClient.patch(
    `/users/${userId}/status`,
    {
      is_active: isActive,
    }
  );
}

export async function createAgent(
  payload: CreateAgentPayload
): Promise<CreateAgentResponse> {
  const response = await apiClient.post<CreateAgentResponse>("/agents", payload);

  return response.data;
}
