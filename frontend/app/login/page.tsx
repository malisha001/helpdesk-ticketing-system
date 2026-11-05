"use client";
import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { login } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();

  setLoading(true);

  try {
    // Call our authentication service
    await login({
      email,
      password,
    });

    // Clear any previous user's cached data
    queryClient.clear();
    toast.success("Logged in successfully");

    // Redirect after successful login
    router.replace("/dashboard");
    //fresh Server Component data for the current route.
    router.refresh();

  } catch (error) {

    toast.error(
      axios.isAxiosError(error) && error.response?.status === 401
        ? "Invalid email or password"
        : "Failed to log in. Please try again."
    );

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">

      <div className="panel w-full max-w-md p-6 sm:p-8">

        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-blue-600">
            HelpDesk
          </h1>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Welcome Back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your support tickets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email"
              className="form-control"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="form-control"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to HelpDesk?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Create Account
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-slate-500">
          Helpdesk Ticketing System
        </p>

      </div>
    </div>
  );
}
