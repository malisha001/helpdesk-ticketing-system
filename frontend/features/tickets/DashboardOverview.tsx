
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
      <p role="status" className="panel p-6 text-sm text-slate-500">
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
      <p role="alert" className="error-state">
        {message}
      </p>
    );
  }

  if (!data?.data) {
    return (
      <p className="empty-state">
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
    <div className="space-y-6">

      {/* Dashboard Statistics */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            Ticket Overview
          </h2>

          {isFetching && (
            <span role="status" className="text-xs text-slate-500">
              Updating...
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="panel p-5 sm:p-6"
            >
              <p className="text-sm font-medium text-slate-500">
                {card.label}
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="panel p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets"
            className="btn-primary"
          >
            View Tickets
          </Link>

          {isCustomer && (
            <Link
              href="/tickets/create"
              className="btn-secondary"
            >
              Create New Ticket
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
