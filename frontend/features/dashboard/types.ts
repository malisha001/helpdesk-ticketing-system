
export interface CustomerDashboardStats {
  total_tickets: number;
  open: number;
  in_progress: number;
  waiting_for_customer: number;
  resolved: number;
}

export interface AgentDashboardStats {
  unassigned_queue: number;
  assigned_to_me: number;
  waiting_for_customer: number;
  my_resolved_tickets: number;
}

export interface AdminDashboardStats {
  total_tickets: number;
  unassigned: number;
  open: number;
  in_progress: number;
  waiting_for_customer: number;
  resolved: number;
}

export type DashboardStats =
  | CustomerDashboardStats
  | AgentDashboardStats
  | AdminDashboardStats;

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}
