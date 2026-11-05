
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useMarkNotificationRead } from "@/hooks/useMarkNotificationRead";

import type { AppNotification } from "@/features/notifications/types";

interface NotificationBellProps {
  userId: number;
}

export default function NotificationBell({
  userId,
}: NotificationBellProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // NEW: Subscribe to real-time notifications
  useRealtimeNotifications(userId);

  // Fetch current user's saved notifications
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
  } = useNotifications(page);

  // Mutation to mark a notification as read
  const {
    mutateAsync,
    isPending: isMarkingRead,
    error: markError,
  } = useMarkNotificationRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta.unread_count ?? 0;
  const lastPage = data?.meta.last_page ?? 1;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  // Open the related ticket after marking as read
  const handleNotificationClick = async (
    notification: AppNotification
  ) => {
    if (isMarkingRead) {
      return;
    }

    try {
      if (notification.read_at === null) {
        await mutateAsync(notification.id);
      }

      setIsOpen(false);

      // Only navigate to an expected internal ticket URL
      const ticketUrl =
        notification.url &&
        /^\/tickets\/[1-9]\d*$/.test(notification.url)
          ? notification.url
          : notification.ticket_id &&
              Number.isSafeInteger(notification.ticket_id) &&
              notification.ticket_id > 0
            ? `/tickets/${notification.ticket_id}`
            : "/tickets";

      router.push(ticketUrl);
    } catch {
      // Keep panel open so the user can see the error
    }
  };

  let loadError = "Failed to load notifications.";

  if (axios.isAxiosError<{ message?: string }>(error)) {
    loadError =
      error.response?.data?.message ?? loadError;
  }

  let markErrorMessage = "Failed to mark notification as read.";

  if (axios.isAxiosError<{ message?: string }>(markError)) {
    markErrorMessage =
      markError.response?.data?.message ?? markErrorMessage;
  }

  return (
    <div ref={containerRef} className="relative">

      {/* Bell Toggle */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-controls="helpdesk-notification-panel"
        className="relative inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span className="hidden sm:inline">Notifications</span>

        {unreadCount > 0 && (
          <span className="min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-xs font-semibold text-white tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <section
          id="helpdesk-notification-panel"
          role="dialog"
          aria-label="Your notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-lg"
        >
          <div className="border-b border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Notifications
              </h2>

              {isFetching && !isPending && (
                <span role="status" className="text-xs text-slate-500">
                  Updating...
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="Close notifications"
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                  <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {unreadCount} unread
            </p>
          </div>

          {/* Loading */}
          {isPending && (
            <p role="status" className="p-4 text-sm text-slate-500">
              Loading notifications...
            </p>
          )}

          {/* Fetch Error */}
          {isError && (
            <p role="alert" className="error-state m-2">
              {loadError}
            </p>
          )}

          {/* Mark as Read Error */}
          {markError && (
            <p role="alert" className="error-state m-2">
              {markErrorMessage}
            </p>
          )}

          {/* Notification List */}
          {!isPending && !isError && (
            <>
              {notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm leading-6 text-slate-500">
                  You’re all caught up.
                  <span className="mt-1 block text-xs">Ticket updates will appear here.</span>
                </p>
              ) : (
                <div className="max-h-[min(24rem,calc(100vh-10rem))] divide-y divide-slate-200 overflow-y-auto overscroll-contain">
                  {notifications.map((notification) => {
                    const isUnread =
                      notification.read_at === null;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        disabled={isMarkingRead}
                        onClick={() => {
                          void handleNotificationClick(notification);
                        }}
                        className={`block w-full border-l-2 p-3 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                          isUnread ? "border-blue-500 bg-blue-50" : "border-transparent bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
                            {notification.title}
                          </p>

                          {isUnread && (
                            <span
                              aria-label="Unread"
                              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                            />
                          )}
                        </div>

                        <p className="mt-2 break-words text-sm leading-5 text-slate-600 [overflow-wrap:anywhere]">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 p-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((previous) =>
                        Math.max(previous - 1, 1)
                      )
                    }
                    disabled={page <= 1 || isFetching}
                    className="min-h-11 rounded-md px-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-xs text-slate-500">
                    {page} / {lastPage}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((previous) => previous + 1)
                    }
                    disabled={
                      page >= lastPage || isFetching
                    }
                    className="min-h-11 rounded-md px-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
