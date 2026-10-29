
"use client";

import { useState } from "react";
import type { TicketListFilters } from "./types";

interface TicketFiltersProps {
  filters: TicketListFilters;
  onSearch: (search: string) => void;
  onStatusChange: (
    status: TicketListFilters["status"]
  ) => void;
  onPriorityChange: (
    priority: TicketListFilters["priority"]
  ) => void;
  onReset: () => void;
}

export default function TicketFilters({
  filters,
  onSearch,
  onStatusChange,
  onPriorityChange,
  onReset,
}: TicketFiltersProps) {
  // Search input is applied only when Search is clicked
  const [searchInput, setSearchInput] = useState(
    filters.search
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(searchInput.trim());
      }}
      className="grid gap-4 md:grid-cols-4"
    >
      {/* Search */}
      <div className="md:col-span-2">
        <label
          htmlFor="ticket-search"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Search Tickets
        </label>

        <input
          id="ticket-search"
          type="search"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
          placeholder="Search tickets..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label
          htmlFor="ticket-status"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Status
        </label>

        <select
          id="ticket-status"
          value={filters.status}
          onChange={(event) =>
            onStatusChange(
              event.target.value as TicketListFilters["status"]
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_customer">
            Waiting for Customer
          </option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label
          htmlFor="ticket-priority"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Priority
        </label>

        <select
          id="ticket-priority"
          value={filters.priority}
          onChange={(event) =>
            onPriorityChange(
              event.target.value as TicketListFilters["priority"]
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 md:col-span-4">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchInput("");
            onReset();
          }}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>
    </form>
  );
}
