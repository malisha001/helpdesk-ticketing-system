
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

//union type for user roles
export type UserRole =
  | "customer"
  | "support_agent"
  | "administrator";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: UserRole[];
}

interface LaravelUser {
  id: number;
  name: string;
  email: string;
  roles?: Array<string | { name: string }>;
}

interface MeResponse {
  data?: LaravelUser | { user: LaravelUser };
  user?: LaravelUser;
}

export async function getCurrentUser(): Promise<AuthUser> {
  // 1. Read the token from the HttpOnly cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("helpdesk_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.LARAVEL_API_URL;

  if (!apiUrl) {
    throw new Error("LARAVEL_API_URL is not configured.");
  }

  // 2. Ask Laravel to validate the token
  const response = await fetch(`${apiUrl}/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // Invalid or rejected session
  if (response.status === 401 || response.status === 403) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Failed to verify authentication.");
  }

  //Read the authenticated user
  const result: unknown = await response.json();
  return normalizeMeResponse(result);
}

export function normalizeMeResponse(value: unknown): AuthUser {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid user response from Laravel.");
  }

  const result = value as MeResponse;
  const data = result.data;

  const user =
    data && "user" in data
      ? data.user
      : data && "id" in data
        ? data
        : result.user;

  if (!user) {
    throw new Error("Invalid user response from Laravel.");
  }

  if (!Array.isArray(user.roles)) {
    throw new Error("Laravel /api/me must return user roles.");
  }

  // Convert Spatie roles into an array of role names
  const allowedRoles: UserRole[] = [
    "customer",
    "support_agent",
    "administrator",
  ];

  const roles = user.roles
    .map((role) =>
      typeof role === "string" ? role : role.name
    )
    .filter((role): role is UserRole =>
      allowedRoles.includes(role as UserRole)
    );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles,
  };
}
