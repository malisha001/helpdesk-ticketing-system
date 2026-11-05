
"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getValidationErrors } from "@/lib/validationErrors";

import { useSupportAgents } from "@/hooks/useSupportAgents";
import { useTicketAssignment } from "@/hooks/useTicketAssignment";

interface TicketAssignmentControlProps {
  ticketId: string;
  currentAgentId: number | null;
}

export default function TicketAssignmentControl({
  ticketId,
  currentAgentId,
}: TicketAssignmentControlProps) {
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const {
    data: agents = [],
    isPending: agentsLoading,
    isError: agentsError,
    error: agentsFetchError,
  } = useSupportAgents();

  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset,
  } = useTicketAssignment(ticketId);

  // If ticket has an agent, the operation is reassignment
  const action =
    currentAgentId === null ? "assign" : "reassign";

  // Don't offer the currently assigned agent as a new choice
  const availableAgents = agents.filter(
    (agent) => agent.id !== currentAgentId
  );

  const selectedId = Number(selectedAgentId);

  const canSubmit =
    selectedAgentId !== "" &&
    Number.isSafeInteger(selectedId) &&
    selectedId > 0 &&
    availableAgents.some((agent) => agent.id === selectedId) &&
    !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      await mutateAsync({
        agentId: selectedId,
        action,
      });

      toast.success(action === "assign" ? "Ticket assigned successfully" : "Ticket reassigned successfully");
      setSelectedAgentId("");
    } catch (error) {
      if (!getValidationErrors(error).agent_id) {
        toast.error(action === "assign" ? "Failed to assign ticket" : "Failed to reassign ticket");
      }
    }
  };

  if (agentsLoading) {
    return <p role="status" className="text-sm text-slate-500">Loading support agents...</p>;
  }

  if (agentsError) {
    const message = axios.isAxiosError<{
      message?: string;
    }>(agentsFetchError)
      ? agentsFetchError.response?.data?.message ??
        "Failed to load support agents."
      : agentsFetchError instanceof Error
        ? agentsFetchError.message
        : "Failed to load support agents.";

    return <p role="alert" className="error-state">{message}</p>;
  }

  const errorMessage = getValidationErrors(error).agent_id;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor={`agent-${ticketId}`}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {action === "assign"
            ? "Select Support Agent"
            : "Select New Support Agent"}
        </label>

        <select
          id={`agent-${ticketId}`}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `agent-error-${ticketId}` : undefined}
          value={selectedAgentId}
          onChange={(event) => {
            setSelectedAgentId(event.target.value);

            if (isError) {
              reset();
            }
          }}
          disabled={isPending || availableAgents.length === 0}
          className="form-control"
        >
          <option value="">Choose an agent</option>

          {availableAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.email})
            </option>
          ))}
        </select>

        {availableAgents.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">
            No eligible support agents available.
          </p>
        )}
      </div>

      {errorMessage && (
        <p id={`agent-error-${ticketId}`} role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary"
      >
        {isPending
          ? "Saving..."
          : action === "assign"
            ? "Assign Ticket"
            : "Reassign Ticket"}
      </button>
    </form>
  );
}
