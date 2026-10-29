
"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { createTicket } from "../api";
import type { TicketPriority } from "../types";

export default function CreateTicketForm() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<TicketPriority>("medium");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (
    e: SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await createTicket({
        subject,
        description,
        priority,
      });

      setSuccess(true);

      // Return to the ticket list
      router.push("/tickets");
    } catch (err) {
      if (axios.isAxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>(err)) {
        const validationErrors = err.response?.data?.errors;

        const firstError = validationErrors
          ? Object.values(validationErrors).flat()[0]
          : undefined;

        setError(
          firstError ??
          err.response?.data?.message ??
          "Failed to create ticket."
        );
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">
        Create Support Ticket
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        Describe your issue so our support team can assist you.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Subject
          </label>

          <input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter ticket subject"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Description
          </label>

          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue in detail"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="priority"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Priority
          </label>

          <select
            id="priority"
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as TicketPriority)
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-600">
            Ticket created successfully.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/tickets")}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
