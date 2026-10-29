
"use client";

import Link from "next/link";
import axios from "axios";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import type { DashboardStats } from "../dashboard/types";

interface DashboardCard {
  label: string;
  value: number;
}

// Convert role-specific statistics into dashboard cards
function buildDashboardCards(
  stats: DashboardStats
): DashboardCard[] {

  // Support Agent
  if ("unassigned_queue" in stats) {
    return [
      {
        label: "Unassigned Queue",
        value: stats.unassigned_queue,
      },
      {
        label: "Assigned to Me",
        value: stats.assigned_to_me,
      },
      {
        label: "Waiting for Customer",
        value: stats.waiting_for_customer,
      },
      {
        label: "My Resolved Tickets",
        value: stats.my_resolved_tickets,
      },
    ];
  }

  // Administrator
  if ("unassigned" in stats) {
    return [
      {
        label: "Total Tickets",
        value: stats.total_tickets,
      },
      {
        label: "Unassigned",
        value: stats.unassigned,
      },
      {
        label: "Open",
        value: stats.open,
      },
      {
        label: "In Progress",
        value: stats.in_progress,
      },
      {
        label: "Waiting for Customer",
        value: stats.waiting_for_customer,
      },
      {
        label: "Resolved",
        value: stats.resolved,
      },
    ];
  }

  // Customer
  return [
    {
      label: "My Tickets",
      value: stats.total_tickets,
    },
    {
      label: "Open",
      value: stats.open,
    },
    {
      label: "In Progress",
      value: stats.in_progress,
    },
    {
      label: "Waiting for Customer",
      value: stats.waiting_for_customer,
    },
    {
      label: "Resolved",
      value: stats.resolved,
    },
  ];
}

export default function DashboardOverview() {
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
  } = useDashboardStats();

  if (isPending) {
    return (
      <p className="text-gray-600">
        Loading dashboard statistics...
      </p>
    );
  }

  if (isError) {
    const message = axios.isAxiosError<{
      message?: string;
    }>(error)
      ? error.response?.data?.message ??
        "Failed to load dashboard."
      : "Failed to load dashboard.";

    return (
      <p role="alert" className="text-red-600">
        {message}
      </p>
    );
  }

  if (!data?.data) {
    return (
      <p className="text-gray-600">
        No dashboard information available.
      </p>
    );
  }

  const stats = data.data;
  const cards = buildDashboardCards(stats);

  const isCustomer =
    !("unassigned" in stats) &&
    !("unassigned_queue" in stats);

  return (
    <div className="space-y-8">

      {/* Dashboard Statistics */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Ticket Overview
          </h2>

          {isFetching && (
            <span className="text-sm text-blue-600">
              Updating...
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">
                {card.label}
              </p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            View Tickets
          </Link>

          {isCustomer && (
            <Link
              href="/tickets/create"
              className="rounded-lg border border-blue-600 px-5 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Create New Ticket
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
