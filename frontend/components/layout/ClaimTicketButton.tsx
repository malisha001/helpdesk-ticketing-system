"use client";

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
  } = useClaimTicket(ticketId);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? "Claiming..." : "Claim Ticket"}
      </button>

    </div>
  );
}
