
import { apiClient } from "@/services/apiClient";

import type {
  NotificationListResponse,
  MarkNotificationReadResponse,
} from "./types";

// Retrieve notifications for the current user
export async function getNotifications(
  page: number = 1
): Promise<NotificationListResponse> {
  const response =
    await apiClient.get<NotificationListResponse>(
      "/notifications",
      {
        params: { page },
      }
    );

  return response.data;
}

// Mark a notification as read
export async function markNotificationRead(
  notificationId: string
): Promise<MarkNotificationReadResponse> {
  const response =
    await apiClient.patch<MarkNotificationReadResponse>(
      `/notifications/${notificationId}/read`
    );

  return response.data;
}
