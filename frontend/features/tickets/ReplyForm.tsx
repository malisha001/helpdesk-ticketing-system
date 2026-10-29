
"use client";

import { useState } from "react";
import axios from "axios";

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

      // Clear the input only after successful submission
      setMessage("");
    } catch {
      // TanStack Query exposes the error through `error`.
      // We display it below instead of clearing the message.
    }
  };

  let errorMessage = "Failed to send reply.";

  if (
    axios.isAxiosError<{ message?: string }>(error)
  ) {
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
          htmlFor={`reply-${ticketId}`}
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Your reply
        </label>

        <textarea
          id={`reply-${ticketId}`}
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
          className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-blue-500 disabled:opacity-60"
        />
      </div>

      {isError && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={!message.trim() || isPending}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
}
