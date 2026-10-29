
export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_for_customer"
  | "resolved";

export type TicketPriority = "low" | "medium" | "high";

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TicketListResponse {
  success: boolean;
  data: Ticket[];
  meta: Pagination;
}


export interface CreateTicketPayload {
  subject: string;
  description: string;
  priority: TicketPriority;
}

export interface CreateTicketResponse {
  success: boolean;
  message?: string;
  data?: Ticket;
}


export interface TicketUser {
  id: number;
  name: string;
  email?: string;
}

export interface TicketReply {
  id: number;
  message: string;
  created_at: string;
  user?: TicketUser | null;
}

export interface TicketHistory {
  id: number;
  action: string;
  created_at: string;
  user?: TicketUser | null;
  old_value?: string | null;
  new_value?: string | null;
}

export interface TicketDetails extends Ticket {
  customer?: TicketUser | null;

  active_assignment?: {
    agent?: TicketUser | null;
  } | null;

  replies?: TicketReply[];
  history?: TicketHistory[];
}

export interface TicketDetailsResponse {
  success: boolean;
  data: TicketDetails;
}

export interface SupportAgent {
  id: number;
  name: string;
  email: string;
}

export interface TicketListFilters {
  search: string;
  status: TicketStatus | "";
  priority: TicketPriority | "";
}