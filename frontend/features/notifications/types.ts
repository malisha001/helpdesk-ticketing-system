
export interface AppNotification {
  id: string;
  event: string;
  title: string;
  message: string;
  ticket_id: number | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  unread_count: number;
}

export interface NotificationListResponse {
  success: boolean;
  data: AppNotification[];
  meta: NotificationPagination;
}

export interface MarkNotificationReadResponse {
  success: boolean;
  message: string;
}
