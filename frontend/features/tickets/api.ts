import { apiClient } from "@/services/apiClient";
import type { TicketListResponse } from "./types";
import type { TicketDetailsResponse } from "./types";

import type {
  CreateTicketPayload,
  CreateTicketResponse,
} from "./types";

export async function getTickets(
  page: number = 1
): Promise<TicketListResponse> {
  const response = await apiClient.get<TicketListResponse>(
    "/tickets",
    {
      params: {
        page,
        per_page: 10,
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
