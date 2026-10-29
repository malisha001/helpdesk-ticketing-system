import { apiClient } from "@/services/apiClient";
import type { TicketListResponse } from "./types";
import type { TicketDetailsResponse } from "./types";
import type { TicketStatus } from "./types";
import type { SupportAgent } from "./types";

import type {
  CreateTicketPayload,
  CreateTicketResponse,
  TicketListFilters,
} from "./types";



export async function getTickets(
  page: number,
  filters: TicketListFilters
): Promise<TicketListResponse> {
  const response = await apiClient.get<TicketListResponse>(
    "/tickets",
    {
      params: {
        page,
        ...(filters.search && {
          search: filters.search,
        }),
        ...(filters.status && {
          status: filters.status,
        }),
        ...(filters.priority && {
          priority: filters.priority,
        }),
      },
    }
  );

  return response.data;
}

export async function createTicket(
  ticket: CreateTicketPayload
): Promise<CreateTicketResponse> {
  const response = await apiClient.post<CreateTicketResponse>(
    "/tickets",
    ticket
  );

  return response.data;
}

export async function getTicketById(
  id: string
): Promise<TicketDetailsResponse> {
  const response = await apiClient.get<TicketDetailsResponse>(
    `/tickets/${id}`
  );

  return response.data;
}

export async function sendTicketReply(
  ticketId: string,
  message: string
): Promise<void> {
  await apiClient.post(
    `/tickets/${ticketId}/replies`,
    { message }
  );
}

export async function claimTicket(
  ticketId: string
): Promise<void> {
  await apiClient.post(
    `/tickets/${ticketId}/claim`
  );
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  await apiClient.patch(
    `/tickets/${ticketId}/status`,
    { status }
  );
}

interface UserRecord {
  id: number;
  name: string;
  email: string;
  roles?: Array<string | { name: string }>;
}

type UsersResponse =
  | UserRecord[]
  | {
      data: UserRecord[];
      meta?: { last_page?: number };
      last_page?: number;
    };

// Fetch support agents for the admin dropdown
export async function getSupportAgents(): Promise<SupportAgent[]> {
  const response = await apiClient.get<UsersResponse>("/auth/users");

  const result = response.data;

  const users = Array.isArray(result)
    ? result
    : result.data;

  if (!Array.isArray(users)) {
    throw new Error("Unexpected users API response.");
  }

  // Avoid showing an incomplete agent list if users are paginated
  if (!Array.isArray(result)) {
    const lastPage =
      result.meta?.last_page ?? result.last_page ?? 1;

    if (lastPage > 1) {
      throw new Error(
        "The users API is paginated. A complete support-agent list is required."
      );
    }
  }

  return users
    .filter((user) =>
      user.roles?.some((role) => {
        const roleName =
          typeof role === "string" ? role : role.name;

        return roleName === "support_agent";
      })
    )
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
}

// Assign an unassigned ticket
export async function assignTicket(
  ticketId: string,
  agentId: number
): Promise<void> {
  await apiClient.post(`/tickets/${ticketId}/assign`, {
    agent_id: agentId,
  });
}

// Reassign a previously assigned ticket
export async function reassignTicket(
  ticketId: string,
  agentId: number
): Promise<void> {
  await apiClient.post(`/tickets/${ticketId}/reassign`, {
    agent_id: agentId,
  });
}

