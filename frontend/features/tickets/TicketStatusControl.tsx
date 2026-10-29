
"use client";

import { useState } from "react";
import axios from "axios";

import { useUpdateTicketStatus } from "@/hooks/useUpdateTicketStatus";
import type { TicketStatus } from "./types";

interface TicketStatusControlProps {
  ticketId: string;
  currentStatus: TicketStatus;
}

// Display only transitions allowed by our workflow
const allowedTransitions: Record<
  TicketStatus,
  TicketStatus[]
> = {
  open: ["in_progress"],
  in_progress: [
    "waiting_for_customer",
    "resolved",
  ],
  waiting_for_customer: ["in_progress"],
  resolved: [],
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_for_customer: "Waiting for Customer",
  resolved: "Resolved",
};

export default function TicketStatusControl({
  ticketId,
  currentStatus,
}: TicketStatusControlProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<TicketStatus | "">("");

  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset,
  } = useUpdateTicketStatus(ticketId);

  const availableStatuses =
    allowedTransitions[currentStatus];

  // A resolved ticket has no next status
  if (availableStatuses.length === 0) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedStatus || isPending) {
      return;
    }

    // Guard against submitting an outdated selection
    if (!availableStatuses.includes(selectedStatus)) {
      return;
    }

    try {
      await mutateAsync(selectedStatus);

      // Clear selection after successful update
      setSelectedStatus("");
    } catch {
      // Keep selected status and show the mutation error
    }
  };

  let errorMessage = "Failed to update ticket status.";

  if (
    axios.isAxiosError<{ message?: string }>(error)
  ) {
    errorMessage =
      error.response?.data?.message ?? errorMessage;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor={`status-${ticketId}`}
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Update Status
        </label>

        <select
          id={`status-${ticketId}`}
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(
              event.target.value as TicketStatus | ""
            );

            if (isError) {
              reset();
            }
          }}
          disabled={isPending}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500 disabled:opacity-60"
        >
          <option value="">
            Select new status
          </option>

          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!selectedStatus || isPending}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Update Status"}
      </button>
    </form>
  );
}
