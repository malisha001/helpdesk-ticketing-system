
"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

import { useTickets } from "@/hooks/useTickets";
import TicketFilters from "./TicketFilters";

import type { TicketListFilters } from "./types";

const emptyFilters: TicketListFilters = {
  search: "",
  status: "",
  priority: "",
};

export default function TicketList() {
  const [page, setPage] = useState(1);

  const [filters, setFilters] =
    useState<TicketListFilters>(emptyFilters);

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
  } = useTickets(page, filters);

  const tickets = data?.data ?? [];
  const pagination = data?.meta;

  const lastPage = pagination?.last_page ?? 1;

  // Apply search and start from the first page
  const handleSearch = (search: string) => {
    setFilters((previous) => ({
      ...previous,
      search,
    }));

    setPage(1);
  };

  const handleStatusChange = (
    status: TicketListFilters["status"]
  ) => {
    setFilters((previous) => ({
      ...previous,
      status,
    }));

    setPage(1);
  };

  const handlePriorityChange = (
    priority: TicketListFilters["priority"]
  ) => {
    setFilters((previous) => ({
      ...previous,
      priority,
    }));

    setPage(1);
  };

  const handleReset = () => {
    setFilters({ ...emptyFilters });
    setPage(1);
  };

  let errorMessage = "Failed to load tickets.";

  if (
    axios.isAxiosError<{ message?: string }>(error)
  ) {
    errorMessage =
      error.response?.data?.message ?? errorMessage;
  }

  return (
    <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow-sm">

      {/* Page Heading */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Tickets
      </h1>

      {/* Search and Filters */}
      <TicketFilters
        filters={filters}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onReset={handleReset}
      />

      <div className="my-6 border-t border-gray-200" />

      {/* Initial Loading */}
      {isPending && (
        <p className="py-6 text-gray-500">
          Loading tickets...
        </p>
      )}

      {/* Error */}
      {isError && (
        <p role="alert" className="py-6 text-red-600">
          {errorMessage}
        </p>
      )}

      {/* Ticket Table */}
      {!isPending && !isError && (
        <>
          {isFetching && (
            <p className="mb-3 text-sm text-blue-600">
              Updating tickets...
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">

              <thead className="bg-slate-50 text-slate-700">
                <tr className="border-b border-slate-300">
                  <th className="px-3 py-4">ID</th>
                  <th className="px-3 py-4">Subject</th>
                  <th className="px-3 py-4">Priority</th>
                  <th className="px-3 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="text-slate-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-200 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      #{ticket.id}
                    </td>

                    <td className="px-3 py-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </td>

                    <td className="px-3 py-4 capitalize">
                      {ticket.priority}
                    </td>

                    <td className="px-3 py-4 capitalize">
                      {ticket.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

            {tickets.length === 0 && (
              <p className="py-8 text-center text-gray-500">
                No tickets found matching your filters.
              </p>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Page {pagination?.current_page ?? page} of{" "}
              {lastPage}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((previous) =>
                    Math.max(previous - 1, 1)
                  )
                }
                disabled={
                  page <= 1 ||
                  isFetching ||
                  isPlaceholderData
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                disabled={
                  page >= lastPage ||
                  isFetching ||
                  isPlaceholderData
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
