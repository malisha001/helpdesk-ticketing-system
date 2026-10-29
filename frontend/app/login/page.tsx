"use client";
import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { login } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {
    // Call our authentication service
    await login({
      email,
      password,
    });

    // Clear any previous user's cached data
    queryClient.clear();

    // Redirect after successful login
    router.replace("/dashboard");
    //fresh Server Component data for the current route.
    router.refresh();

  } catch (error) {

    if (axios.isAxiosError<{ message?: string }>(error)) {
      setError(
        error.response?.data?.message ||
        "Unable to connect to the login service."
      );
    } else {
      setError("Something went wrong. Please try again.");
    }

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            HelpDesk
          </h1>

          <h2 className="mt-3 text-2xl font-semibold text-gray-900">
            Welcome Back
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your support tickets.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Helpdesk Ticketing System
        </p>

      </div>
    </div>
  );
}
