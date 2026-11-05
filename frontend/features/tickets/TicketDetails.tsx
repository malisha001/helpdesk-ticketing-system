"use client";

import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import ReplyForm from "./ReplyForm";
import { useTicket } from "../../hooks/useTicket";
import ClaimTicketButton from "../../components/layout/ClaimTicketButton";
import TicketStatusControl from "./TicketStatusControl";
import TicketAssignmentControl from "./TicketAssignmentControl";
import { formatAttachmentSize } from "./attachments";
import { TicketPriorityBadge, TicketStatusBadge } from "./TicketBadge";
interface TicketDetailsProps {
  ticketId: string;
}

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  // Fetch ticket details using TanStack Query
  const { data, isPending, isError, error, isFetching } = useTicket(ticketId);
  // Read the current user from TanStack Query's auth cache
  const { data: currentUser } = useAuth();
  // Extract ticket data from the API response
  const ticket = data?.data;

  // Initial loading state
  if (isPending) {
    return <p role="status" className="panel p-6 text-sm text-slate-500">Loading ticket details...</p>;
  }

  // Error handling
  if (isError) {
    let message = "Failed to load ticket details.";

    if (axios.isAxiosError<{ message?: string }>(error)) {
      message = error.response?.data?.message ?? message;
    }

    return (
      <p role="alert" className="error-state">
        {message}
      </p>
    );
  }

  // Ticket not found
  if (!ticket) {
    return <p className="empty-state">Ticket not found. Return to the ticket list to find another request.</p>;
  }
  const isAdministrator =
  currentUser?.roles.includes("administrator") === true;

  const canManageAssignment =
  isAdministrator && ticket.status !== "resolved";
  
  const canClaim =
  currentUser?.roles.includes("support_agent") === true &&
  ticket.status === "open" &&
  !ticket.active_assignment;

  const isCustomer =
  currentUser?.roles.includes("customer") ?? false;

  const isAssignedAgent =
  (currentUser?.roles.includes("support_agent") ?? false) &&
  ticket.active_assignment?.agent?.id === currentUser?.id;

  const canUpdateStatus =
  isAssignedAgent &&
  ticket.status !== "resolved";

  const canReply =
  ticket.status !== "resolved" &&
  (isCustomer || isAssignedAgent);

  // Sort replies chronologically
  const replies = [...(ticket.replies ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  // Sort ticket history chronologically
  const history = [...(ticket.history ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return (
    <div className="space-y-6">
      {/* Back to Ticket List */}
      <Link href="/tickets" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
        ← Back to Tickets
      </Link>

      {/* Background fetching indicator */}
      {isFetching && (
        <p role="status" className="text-xs text-slate-500">Updating ticket details...</p>
      )}

      {/* Ticket Information */}
      <section className="panel p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">Ticket #{ticket.id}</p>

            <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900">
              {ticket.subject}
            </h1>
          </div>

          <TicketStatusBadge status={ticket.status} />
        </div>

        <div className="mt-6 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {/* Priority */}
          <div>
            <p className="text-slate-500">Priority</p>
            <div className="mt-1"><TicketPriorityBadge priority={ticket.priority} /></div>
          </div>

          {/* Created Date */}
          <div>
            <p className="text-slate-500">Created</p>
            <p className="break-words font-medium text-slate-900">
              {ticket.created_at.slice(0, 10)}
            </p>
          </div>

          {/* Customer */}
          <div>
            <p className="text-slate-500">Customer</p>
            <p className="break-words font-medium text-slate-900">
              {ticket.customer?.name ?? "Not available"}
            </p>
          </div>

          {/* Assigned Agent */}
          <div>
            <p className="text-slate-500">Assigned Agent</p>
            <p className="break-words font-medium text-slate-900">
              {ticket.active_assignment?.agent?.name ?? "Unassigned"}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h2 className="font-semibold text-slate-900">Description</h2>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
            {ticket.description}
          </p>
        </div>
      </section>
      
      {/* Support Agent Status Management */}
      <section className="panel p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Attachments ({ticket.attachments?.length ?? 0})</h2>
        {!ticket.attachments?.length ? (
          <p className="empty-state mt-4">No attachments for this ticket.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ticket.attachments.map((attachment) => (
              <li key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <span className="min-w-0 break-all text-slate-700">
                  {attachment.original_name} — {formatAttachmentSize(attachment.size)}
                </span>
                <a
                  href={`/api/tickets/${ticket.id}/attachments/${attachment.id}/download`}
                  className="btn-secondary shrink-0"
                  aria-label={`Download ${attachment.original_name}`}
                >Download</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canUpdateStatus && (
        <section className="panel p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Manage Ticket Status
          </h2>

          <p className="mb-4 text-sm text-slate-600">
            Current status:{" "}
            <TicketStatusBadge status={ticket.status} />
          </p>

          <TicketStatusControl
            ticketId={ticketId}
            currentStatus={ticket.status}
          />
        </section>
      )}  
      
{/* Administrator Ticket Assignment */}
{canManageAssignment && (
  <section className="panel p-4 sm:p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900">
      {ticket.active_assignment
        ? "Reassign Ticket"
        : "Assign Ticket"}
    </h2>

    <p className="mb-4 text-sm text-slate-600">
      Current agent:{" "}
      <span className="font-medium">
        {ticket.active_assignment?.agent?.name ??
          "Unassigned"}
      </span>
    </p>

    <TicketAssignmentControl
      ticketId={ticketId}
      currentAgentId={
        ticket.active_assignment?.agent?.id ?? null
      }
    />
  </section>
)}

      {/* Claim Ticket Action */}
      {canClaim && (
        <section className="panel p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Take Ownership
          </h2>

          <p className="mb-4 text-sm text-slate-600">
            This ticket is currently unassigned.
            Claim it to start handling the customer request.
          </p>

          <ClaimTicketButton ticketId={ticketId} />
        </section>
      )}

      {/* Ticket Replies */}
      <section className="panel p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>

        {replies.length === 0 ? (
          <p className="empty-state mt-4">No replies yet. Conversation updates will appear here.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {replies.map((reply) => (
              <article key={reply.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {reply.user?.name ?? "User"}
                  </p>

                  <p className="text-xs text-slate-500">
                    {reply.created_at.slice(0, 10)}
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {reply.message}
                </p>
              </article>
            ))}
          </div>
        )}
        
      {/* Reply Form */}
      {canReply && (
        <section className="mt-6 border-t border-slate-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Add a Reply
          </h2>

          <ReplyForm ticketId={ticketId} />
        </section>
      )}
      </section>

      {/* Ticket History */}
      <section className="panel p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Activity History
        </h2>

        {history.length === 0 ? (
          <p className="empty-state mt-4">No activity recorded.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border-l-2 border-blue-400 pl-4">
                <p className="text-sm font-medium capitalize text-slate-900">
                  {item.action.replaceAll("_", " ")}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {item.user?.name ?? "System"} · {item.created_at.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
