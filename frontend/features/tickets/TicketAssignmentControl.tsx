
"use client";

import { useState } from "react";
import axios from "axios";

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

      setSelectedAgentId("");
    } catch {
      // TanStack Query stores the error.
    }
  };

  if (agentsLoading) {
    return <p>Loading support agents...</p>;
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

    return <p role="alert" className="text-red-600">{message}</p>;
  }

  let errorMessage = "Failed to update ticket assignment.";

  if (axios.isAxiosError<{ message?: string }>(error)) {
    errorMessage =
      error.response?.data?.message ?? errorMessage;
  }

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
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          {action === "assign"
            ? "Select Support Agent"
            : "Select New Support Agent"}
        </label>

        <select
          id={`agent-${ticketId}`}
          value={selectedAgentId}
          onChange={(event) => {
            setSelectedAgentId(event.target.value);

            if (isError) {
              reset();
            }
          }}
          disabled={isPending || availableAgents.length === 0}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-blue-500 disabled:opacity-60"
        >
          <option value="">Choose an agent</option>

          {availableAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.email})
            </option>
          ))}
        </select>

        {availableAgents.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No eligible support agents available.
          </p>
        )}
      </div>

      {isError && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
