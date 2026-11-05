"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

import { useTickets } from "@/hooks/useTickets";
import TicketFilters from "./TicketFilters";
import { TicketPriorityBadge, TicketStatusBadge } from "./TicketBadge";

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
    <div className="panel p-4 sm:p-6">

      {/* Page Heading */}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Tickets
      </h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Search and follow the progress of your support tickets.</p>

      {/* Search and Filters */}
      <TicketFilters
        filters={filters}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onReset={handleReset}
      />

      <div className="my-6 border-t border-slate-200" />

      {/* Initial Loading */}
      {isPending && (
        <p role="status" className="empty-state">
          Loading tickets...
        </p>
      )}

      {/* Error */}
      {isError && (
        <p role="alert" className="error-state">
          {errorMessage}
        </p>
      )}

      {/* Ticket Table */}
      {!isPending && !isError && (
        <>
          {isFetching && (
            <p role="status" className="mb-3 text-xs text-slate-500">
              Updating tickets...
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <caption className="sr-only">Support tickets with priority and current status</caption>

              <thead className="bg-slate-50 text-slate-700">
                <tr className="border-b border-slate-200">
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
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4 text-xs text-slate-500 tabular-nums">
                      #{ticket.id}
                    </td>

                    <td className="max-w-sm break-words px-3 py-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                    </td>

                    <td className="px-3 py-4 capitalize">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="px-3 py-4 capitalize">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

            {tickets.length === 0 && (
              <p className="p-8 text-center text-sm leading-6 text-slate-500">
                No tickets found matching your filters.
                <span className="block">Try a different search or clear your filters.</span>
              </p>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
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
                className="btn-secondary"
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
                className="btn-secondary"
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
