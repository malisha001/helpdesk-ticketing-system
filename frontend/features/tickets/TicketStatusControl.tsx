
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getValidationErrors } from "@/lib/validationErrors";

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
      toast.success("Ticket status updated successfully");

      // Clear selection after successful update
      setSelectedStatus("");
    } catch (error) {
      if (!getValidationErrors(error).status) {
        toast.error("Failed to update ticket status");
      }
    }
  };

  const errorMessage = getValidationErrors(error).status;

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
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Update Status
        </label>

        <select
          id={`status-${ticketId}`}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `status-error-${ticketId}` : undefined}
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
          className="form-control"
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

      {errorMessage && (
        <p id={`status-error-${ticketId}`} role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!selectedStatus || isPending}
        className="btn-primary"
      >
        {isPending ? "Updating..." : "Update Status"}
      </button>
    </form>
  );
}
