
"use client";

import axios from "axios";
import { useClaimTicket } from "@/hooks/useClaimTicket";

interface ClaimTicketButtonProps {
  ticketId: string;
}

export default function ClaimTicketButton({
  ticketId,
}: ClaimTicketButtonProps) {
  const {
    mutate,
    isPending,
    isError,
    error,
  } = useClaimTicket(ticketId);

  let errorMessage = "Failed to claim ticket.";

  if (axios.isAxiosError<{ message?: string }>(error)) {
    errorMessage =
      error.response?.data?.message ?? errorMessage;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Claiming..." : "Claim Ticket"}
      </button>

      {isError && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
