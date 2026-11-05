"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getValidationErrors } from "@/lib/validationErrors";

import { useCreateAgent } from "@/hooks/useCreateAgent";
import type { CreateAgentPayload, CreateAgentResponse } from "./types";

type FieldErrors = Partial<Record<keyof CreateAgentPayload, string>>;

export default function CreateAgentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createdAgent, setCreatedAgent] = useState<CreateAgentResponse | null>(null);
  const submitting = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const { mutateAsync, isPending } = useCreateAgent();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting.current || isPending || createdAgent) {
      return;
    }

    const payload: CreateAgentPayload = {
      name: name.trim(),
      email: email.trim(),
    };
    const errors: FieldErrors = {};

    if (!payload.name) {
      errors.name = "Enter the agent's full name.";
    } else if (payload.name.length > 255) {
      errors.name = "The name must not exceed 255 characters.";
    }

    if (!payload.email) {
      errors.email = "Enter the agent's email address.";
    } else if (payload.email.length > 255) {
      errors.email = "The email must not exceed 255 characters.";
    } else if (emailInput.current?.validity.typeMismatch) {
      errors.email = "Enter a valid email address.";
    }

    setFieldErrors(errors);

    if (errors.name || errors.email) {
      (errors.name ? nameInput : emailInput).current?.focus();
      return;
    }

    submitting.current = true;

    try {
      const result = await mutateAsync(payload);
      toast.success("Support agent created successfully");
      setCreatedAgent(result);
      setName("");
      setEmail("");
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      const errors: FieldErrors = {
        name: validationErrors.name,
        email: validationErrors.email,
      };
      setFieldErrors(errors);
      if (errors.name || errors.email) {
        (errors.name ? nameInput : emailInput).current?.focus();
      } else {
        toast.error("Failed to create support agent");
      }
    } finally {
      submitting.current = false;
    }
  };

  return (
    <div className="panel mx-auto max-w-2xl p-5 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create Support Agent</h1>

      {createdAgent ? (
        <div className="mt-6 space-y-4">
          <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="mt-2">
              {createdAgent.data.name} ({createdAgent.data.email}) has been added as a support agent.
              The account is inactive and cannot sign in until password setup and activation are complete.
            </p>
          </div>
          <Link
            href="/users"
            className="btn-primary"
          >
            Back to Manage Users
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">
            Add a staff account using their full name and email address. New accounts
            are inactive, with password setup pending. No sign-in details are sent by email.
          </p>

          <form onSubmit={handleSubmit} noValidate aria-busy={isPending} className="mt-6 space-y-6">
            <div>
              <label htmlFor="agent-name" className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                ref={nameInput}
                id="agent-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={255}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "agent-name-error" : undefined}
                className="form-control"
              />
              {fieldErrors.name && (
                <p id="agent-name-error" className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="agent-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                ref={emailInput}
                id="agent-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isPending}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "agent-email-error" : undefined}
                className="form-control"
              />
              {fieldErrors.email && (
                <p id="agent-email-error" className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
              >
                {isPending ? "Creating agent..." : "Create Agent"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/users")}
                disabled={isPending}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
