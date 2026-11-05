
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getValidationErrors } from "@/lib/validationErrors";

import { useSendTicketReply } from "@/hooks/useSendTicketReply";

interface ReplyFormProps {
  ticketId: string;
}

export default function ReplyForm({
  ticketId,
}: ReplyFormProps) {
  const [message, setMessage] = useState("");

  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset,
  } = useSendTicketReply(ticketId);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isPending) {
      return;
    }

    try {
      // Send reply and wait for the mutation to succeed
      await mutateAsync(trimmedMessage);
      toast.success("Reply sent successfully");

      // Clear the input only after successful submission
      setMessage("");
    } catch (error) {
      if (!getValidationErrors(error).message) {
        toast.error("Failed to send reply");
      }
    }
  };

  const errorMessage = getValidationErrors(error).message;

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
          htmlFor={`reply-${ticketId}`}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Your reply
        </label>

        <textarea
          id={`reply-${ticketId}`}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `reply-error-${ticketId}` : undefined}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);

            if (isError) {
              reset();
            }
          }}
          rows={4}
          placeholder="Write your reply here..."
          disabled={isPending}
          className="form-control"
        />
      </div>

      {errorMessage && (
        <p id={`reply-error-${ticketId}`} role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!message.trim() || isPending}
        className="btn-primary"
      >
        {isPending ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
}
