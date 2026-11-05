
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_active?: boolean | 0 | 1;
  roles?: Array<string | { name: string }>;
  role?: string;
}

export interface UserPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  meta: UserPagination;
}

export type AdminRoleFilter =
  | ""
  | "customer"
  | "support_agent"
  | "administrator";

export type AdminStatusFilter = "" | "1" | "0";

export interface AdminUsersFilters {
  page: number;
  search: string;
  role: AdminRoleFilter;
  is_active: AdminStatusFilter;
}

export interface CreateAgentPayload {
  name: string;
  email: string;
}

export interface CreateAgentResponse {
  success: boolean;
  message: string;
  data: Pick<AdminUser, "id" | "name" | "email"> & {
    is_active: boolean;
    role: "support_agent";
  };
}
