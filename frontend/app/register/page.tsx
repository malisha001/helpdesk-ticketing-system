"use client";

import { useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getValidationErrors } from "@/lib/validationErrors";

import { register, type RegisterCredentials } from "@/services/authService";

type RegistrationErrors = Partial<Record<keyof RegisterCredentials, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const focusField = (errors: RegistrationErrors) => {
    const field = Object.keys(errors).find(
      (key) => errors[key as keyof RegistrationErrors]
    );
    const input = field ? formRef.current?.elements.namedItem(field) : null;

    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting.current) {
      return;
    }

    const errors: RegistrationErrors = {};
    const emailInput = event.currentTarget.elements.namedItem("email");

    if (!name.trim()) {
      errors.name = "Enter your full name.";
    } else if (name.trim().length > 255) {
      errors.name = "Your name must not exceed 255 characters.";
    }

    if (!email.trim()) {
      errors.email = "Enter your email address.";
    } else if (email.trim().length > 255) {
      errors.email = "Your email must not exceed 255 characters.";
    } else if (emailInput instanceof HTMLInputElement && emailInput.validity.typeMismatch) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Enter a password.";
    }

    if (!confirmation) {
      errors.password_confirmation = "Confirm your password.";
    } else if (password !== confirmation) {
      errors.password_confirmation = "The passwords do not match.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusField(errors);
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmation,
      });

      setPassword("");
      setConfirmation("");
      toast.success("Account created successfully");
      router.replace("/login");
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      const errors: RegistrationErrors = {
        name: validationErrors.name,
        email: validationErrors.email,
        password: validationErrors.password,
        password_confirmation: validationErrors.password_confirmation,
      };
      setFieldErrors(errors);
      if (Object.values(errors).some(Boolean)) {
        focusField(errors);
      } else {
        toast.error("Failed to create account");
      }

      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-blue-600">HelpDesk</h1>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Register as a customer to submit and track your support tickets.
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={loading} className="space-y-5">
          <div>
            <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              readOnly={loading}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
              className="form-control"
            />
            {fieldErrors.name && <p id="register-name-error" className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              readOnly={loading}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
              className="form-control"
            />
            {fieldErrors.email && <p id="register-email-error" className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              readOnly={loading}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
              className="form-control"
            />
            {fieldErrors.password && <p id="register-password-error" className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="register-confirmation" className="mb-2 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="register-confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              readOnly={loading}
              aria-invalid={Boolean(fieldErrors.password_confirmation)}
              aria-describedby={fieldErrors.password_confirmation ? "register-confirmation-error" : undefined}
              className="form-control"
            />
            {fieldErrors.password_confirmation && <p id="register-confirmation-error" className="mt-2 text-sm text-red-600">{fieldErrors.password_confirmation}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
