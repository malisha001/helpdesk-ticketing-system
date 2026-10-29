"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";

export default function LogoutButton() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await logout();
      queryClient.clear();
      
      if (!result.serverRevoked) {
        window.alert(
          "Signed out locally, but Laravel token revocation could not be confirmed."
        );
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Logout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? "Logging out..." : "Logout"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
