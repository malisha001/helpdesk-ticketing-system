
"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

import { useTickets } from "../hooks/useTickets";

export default function TicketList() {
  const [page, setPage] = useState(1);

  const {
    data,
    error,
    isPending,
    isError,
    isFetching,
    isPlaceholderData,
  } = useTickets(page);

  const tickets = data?.data ?? [];
  const pagination = data?.meta;

  // Initial loading state
  if (isPending) {
    return (
      <p className="text-gray-500">
        Loading tickets...
      </p>
    );
  }

  // API error handling
  if (isError) {
    let message = "Failed to load tickets.";

    if (axios.isAxiosError(error)) {
      message =
        error.response?.data?.message ?? message;
    }

    return (
      <p role="alert" className="text-red-600">
        {message}
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Tickets
        </h1>

        {isFetching && (
          <p className="text-sm text-blue-600">
            Updating...
          </p>
        )}
      </div>

      {tickets.length === 0 ? (
        <p className="text-gray-500">
          No tickets found.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">
                      #{ticket.id}
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </td>

                    <td className="p-3 capitalize">
                      {ticket.priority}
                    </td>

                    <td className="p-3 capitalize">
                      {ticket.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.current_page} of{" "}
                {pagination.last_page}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) => previous - 1)
                  }
                  disabled={page <= 1 || isPlaceholderData}
                  className="rounded border px-4 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) => previous + 1)
                  }
                  disabled={
                    isPlaceholderData ||
                    page >= pagination.last_page
                  }
                  className="rounded border px-4 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
