
"use client";

import Link from "next/link";
import axios from "axios";

import { useTicket } from "../hooks/useTicket";

interface TicketDetailsProps {
  ticketId: string;
}

export default function TicketDetails({
  ticketId,
}: TicketDetailsProps) {

  // Fetch ticket details using TanStack Query
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
  } = useTicket(ticketId);

  // Extract ticket data from the API response
  const ticket = data?.data;

  // Initial loading state
  if (isPending) {
    return (
      <p className="text-gray-500">
        Loading ticket details...
      </p>
    );
  }

  // Error handling
  if (isError) {
    let message = "Failed to load ticket details.";

    if (axios.isAxiosError<{ message?: string }>(error)) {
      message =
        error.response?.data?.message ?? message;
    }

    return (
      <p role="alert" className="text-red-600">
        {message}
      </p>
    );
  }

  // Ticket not found
  if (!ticket) {
    return <p>Ticket not found.</p>;
  }

  // Sort replies chronologically
  const replies = [...(ticket.replies ?? [])].sort(
    (a, b) => a.created_at.localeCompare(b.created_at)
  );

  // Sort ticket history chronologically
  const history = [...(ticket.history ?? [])].sort(
    (a, b) => a.created_at.localeCompare(b.created_at)
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Back to Ticket List */}
      <Link
        href="/tickets"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Tickets
      </Link>

      {/* Background fetching indicator */}
      {isFetching && (
        <p className="text-sm text-blue-600">
          Updating ticket details...
        </p>
      )}

      {/* Ticket Information */}
      <section className="rounded-xl bg-white p-6 shadow-sm">

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">
              Ticket #{ticket.id}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
          </div>

          <span className="rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-800">
            {ticket.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">

          {/* Priority */}
          <div>
            <p className="text-gray-500">Priority</p>
            <p className="font-medium capitalize text-gray-900">
              {ticket.priority}
            </p>
          </div>

          {/* Created Date */}
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">
              {ticket.created_at.slice(0, 10)}
            </p>
          </div>

          {/* Customer */}
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">
              {ticket.customer?.name ?? "Not available"}
            </p>
          </div>

          {/* Assigned Agent */}
          <div>
            <p className="text-gray-500">Assigned Agent</p>
            <p className="font-medium text-gray-900">
              {ticket.active_assignment?.agent?.name ??
                "Unassigned"}
            </p>
          </div>

        </div>

        {/* Description */}
        <div className="mt-6 border-t pt-5">
          <h2 className="font-semibold text-gray-900">
            Description
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-gray-700">
            {ticket.description}
          </p>
        </div>

      </section>

      {/* Ticket Replies */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Conversation
        </h2>

        {replies.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No replies yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">

            {replies.map((reply) => (
              <article
                key={reply.id}
                className="rounded-lg bg-slate-50 p-4"
              >
                <div className="flex justify-between gap-3">

                  <p className="font-medium text-gray-900">
                    {reply.user?.name ?? "User"}
                  </p>

                  <p className="text-xs text-gray-500">
                    {reply.created_at.slice(0, 10)}
                  </p>

                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                  {reply.message}
                </p>
              </article>
            ))}

          </div>
        )}
      </section>

      {/* Ticket History */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Activity History
        </h2>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No activity recorded.
          </p>
        ) : (
          <div className="mt-5 space-y-4">

            {history.map((item) => (
              <div
                key={item.id}
                className="border-l-2 border-blue-400 pl-4"
              >
                <p className="text-sm font-medium capitalize text-gray-900">
                  {item.action.replaceAll("_", " ")}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {item.user?.name ?? "System"} ·{" "}
                  {item.created_at.slice(0, 10)}
                </p>
              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}
