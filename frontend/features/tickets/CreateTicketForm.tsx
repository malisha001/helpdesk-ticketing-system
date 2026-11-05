"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getValidationErrors } from "@/lib/validationErrors";
import { createTicket } from "./api";
import type { TicketPriority } from "./types";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS, formatAttachmentSize, validateAttachments } from "./attachments";

export default function CreateTicketForm() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const fileError = validateAttachments(attachments);
    if (fileError) {
      setAttachmentError(fileError);
      return;
    }

    setLoading(true);
    setFieldErrors({});
    setAttachmentError("");

    try {
      await createTicket({
        subject,
        description,
        priority,
        attachments,
      });

      toast.success("Ticket created successfully");

      // Return to the ticket list
      router.push("/tickets");
    } catch (err) {
      const errors = getValidationErrors(err);
      const attachmentMessage = Object.entries(errors)
        .filter(([field]) => field === "attachments" || field.startsWith("attachments."))
        .map(([, message]) => message)
        .join(" ");
      setFieldErrors(errors);
      setAttachmentError(attachmentMessage);
      if (!errors.subject && !errors.description && !errors.priority && !attachmentMessage) {
        toast.error("Failed to create ticket");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel mx-auto max-w-2xl p-5 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create Support Ticket
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        Describe your issue so our support team can assist you.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Subject
          </label>

          <input
            id="subject"
            aria-invalid={Boolean(fieldErrors.subject)}
            aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter ticket subject"
            className="form-control"
          />
          {fieldErrors.subject && <p id="subject-error" role="alert" className="mt-2 text-sm text-red-600">{fieldErrors.subject}</p>}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>

          <textarea
            id="description"
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? "description-error" : undefined}
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue in detail"
            className="form-control"
          />
          {fieldErrors.description && <p id="description-error" role="alert" className="mt-2 text-sm text-red-600">{fieldErrors.description}</p>}
        </div>

        <div>
          <label
            htmlFor="priority"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Priority
          </label>

          <select
            id="priority"
            aria-invalid={Boolean(fieldErrors.priority)}
            aria-describedby={fieldErrors.priority ? "priority-error" : undefined}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="form-control"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {fieldErrors.priority && <p id="priority-error" role="alert" className="mt-2 text-sm text-red-600">{fieldErrors.priority}</p>}
        </div>

        <div>
          <label htmlFor="attachments" className="mb-2 block text-sm font-medium text-slate-700">
            Attachments (optional)
          </label>
          <p id="attachment-help" className="mb-3 text-sm text-slate-500">
            Up to {MAX_ATTACHMENTS} files, 5 MB each. PDF, PNG, JPG/JPEG, TXT, DOC or DOCX.
          </p>
          <input
            id="attachments"
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            disabled={loading}
            aria-describedby="attachment-help attachment-error"
            aria-invalid={Boolean(attachmentError)}
            onChange={(event) => {
              const selected = [...attachments, ...Array.from(event.target.files ?? [])];
              const message = validateAttachments(selected);
              setAttachmentError(message ?? "");
              if (!message) setAttachments(selected);
              event.target.value = "";
            }}
            className="form-control border-dashed bg-slate-50 p-3 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700"
          />
          <p id="attachment-error" role={attachmentError ? "alert" : undefined} className="mt-2 text-sm text-red-600">
            {attachmentError}
          </p>
          {attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <span className="min-w-0 break-all text-slate-700">{file.name} — {formatAttachmentSize(file.size)}</span>
                  <button
                    type="button"
                    disabled={loading}
                    aria-label={`Remove ${file.name}`}
                    className="min-h-11 shrink-0 rounded-md px-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    onClick={() => {
                      setAttachments((files) => files.filter((_, position) => position !== index));
                      setAttachmentError("");
                    }}
                  >Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/tickets")}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
