
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createEcho } from "@/lib/echo";

export function useRealtimeNotifications(userId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Validate authenticated user ID
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return;
    }

    // 2. Connect to Laravel Reverb
    const echo = createEcho();

    if (!echo) {
      return;
    }

    const channelName = `App.Models.User.${userId}`;

    let refreshTimeout: ReturnType<typeof setTimeout> | null =
      null;

    // 3. Shared function to refresh notification data
    const refreshNotifications = () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    };

    // 4. Subscribe to the authenticated user's channel
    const channel = echo.private(channelName);

    // 5. Refresh after initial subscription
    // and after a successful resubscription
    channel.subscribed(() => {
      console.log(
        "[Realtime] Subscribed:",
        channelName
      );

      refreshNotifications();
    });

    // 6. Handle incoming broadcast notifications
    channel.notification((notification: unknown) => {
      console.log(
        "[Realtime] Notification received:",
        notification
      );

      // Refresh immediately
      refreshNotifications();

      // Database notification job may finish
      // slightly after the broadcast job
      if (refreshTimeout !== null) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        refreshNotifications();
      }, 1000);
    });

    // 7. Log subscription errors
    channel.error((error: unknown) => {
      console.error(
        "[Realtime] Subscription error:",
        error
      );
    });

    // 8. Cleanup on unmount or user change
    return () => {
      if (refreshTimeout !== null) {
        clearTimeout(refreshTimeout);
      }

      echo.leave(channelName);
      echo.disconnect();
    };
  }, [userId, queryClient]);
}
