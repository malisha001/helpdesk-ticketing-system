import type { TicketPriority, TicketStatus } from "./types";

const statusStyles: Record<TicketStatus, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  waiting_for_customer: "border-amber-200 bg-amber-50 text-amber-800",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_for_customer: "Waiting for customer",
  resolved: "Resolved",
};

const priorityStyles: Record<TicketPriority, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700",
};

const badgeClass = "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-4";

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`${badgeClass} ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`${badgeClass} capitalize ${priorityStyles[priority]}`}>{priority}</span>;
}
