
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useUpdateUserStatus } from "@/hooks/useUpdateUserStatus";

import type {
  AdminRoleFilter,
  AdminStatusFilter,
  AdminUser,
} from "./types";

interface ManageUsersProps {
  currentUserId: number;
}

// Get role names from the user
function getRoleNames(user: AdminUser): string[] {
  if (user.roles?.length) {
    return user.roles.map((role) =>
      typeof role === "string" ? role : role.name
    );
  }

  return user.role ? [user.role] : [];
}

// Check whether a user is active
function isUserActive(user: AdminUser): boolean {
  return user.is_active === true || user.is_active === 1;
}

export default function ManageUsers({
  currentUserId,
}: ManageUsersProps) {
  // Pagination
  const [page, setPage] = useState(1);

  // Draft inputs are only applied when the form is submitted.
  const [searchInput, setSearchInput] = useState("");
  const [roleInput, setRoleInput] = useState<AdminRoleFilter>("");
  const [statusInput, setStatusInput] = useState<AdminStatusFilter>("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AdminRoleFilter>("");
  const [status, setStatus] = useState<AdminStatusFilter>("");

  // Fetch users
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useAdminUsers({
    page,
    search,
    role,
    is_active: status,
  });

  // Update user active/inactive status
  const {
    mutateAsync: changeUserStatus,
    isPending: isUpdatingStatus,
    variables: updatingUser,
  } = useUpdateUserStatus();

  const users = data?.data ?? [];

  const currentPage = data?.meta?.current_page ?? page;
  const lastPage = data?.meta?.last_page ?? 1;
  const total = data?.meta?.total ?? 0;

  // A status update can remove the last matching user on the last page.
  if (data && !isPlaceholderData && !isFetching && page > lastPage) {
    setPage(lastPage);
  }

  // Apply search, role, and status together.
  const handleApplyFilters = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
    setRole(roleInput);
    setStatus(statusInput);

    if (
      page === 1 &&
      search === searchInput.trim() &&
      role === roleInput &&
      status === statusInput
    ) {
      void refetch();
    }
  };

  // Clear all draft and applied filters.
  const handleClear = () => {
    setSearchInput("");
    setRoleInput("");
    setStatusInput("");
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);

    if (page === 1 && search === "" && role === "" && status === "") {
      void refetch();
    }
  };

  // Activate or deactivate user
  const handleStatusChange = async (user: AdminUser) => {
    const roleNames = getRoleNames(user);

    const isAdminAccount =
      roleNames.includes("administrator");

    // Prevent self-deactivation and changing admins
    if (
      user.id === currentUserId ||
      isAdminAccount ||
      user.is_active === undefined ||
      isUpdatingStatus ||
      isFetching ||
      isPlaceholderData
    ) {
      return;
    }

    const currentlyActive = isUserActive(user);
    const nextStatus = !currentlyActive;

    const action = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await changeUserStatus({
        userId: user.id,
        isActive: nextStatus,
      });
      toast.success(nextStatus ? "User activated successfully" : "User deactivated successfully");
    } catch {
      toast.error("Failed to update account status");
    }
  };

  return (
    <main className="page-shell">
      {/* Page Heading */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Manage Users
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            View and manage Helpdesk user accounts.
          </p>
        </div>

        <Link
          href="/users/create-agent"
          className="btn-primary"
        >
          Create Agent
        </Link>
      </div>

      {/* User Filters */}
      <form
        onSubmit={handleApplyFilters}
        className="panel mb-6 grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="space-y-2 sm:col-span-2">
          <span className="block text-sm font-medium text-slate-700">Search users</span>
        <input
          type="text"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
          placeholder="Search by name or email..."
          aria-label="Search users"
          className="form-control"
        />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Role</span>
        <select
          value={roleInput}
          onChange={(event) =>
            setRoleInput(event.target.value as AdminRoleFilter)
          }
          aria-label="Filter by role"
          className="form-control"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="support_agent">Support Agent</option>
          <option value="administrator">Administrator</option>
        </select>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Account status</span>
        <select
          value={statusInput}
          onChange={(event) =>
            setStatusInput(event.target.value as AdminStatusFilter)
          }
          aria-label="Filter by account status"
          className="form-control"
        >
          <option value="">All Statuses</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
        </label>

        <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-4">
        <button
          type="submit"
          className="btn-secondary"
        >
          Search
        </button>

        <button
          type="submit"
          className="btn-primary"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary"
        >
          Clear
        </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="overflow-hidden panel">

        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            User Accounts
          </h2>

          <span className="text-sm text-slate-500">
            {total} users
          </span>
        </div>

        {/* Initial Loading */}
        {isPending ? (
          <p role="status" className="p-6 text-sm text-slate-500">
            Loading users...
          </p>
        ) : isError ? (
          /* Fetch Error */
          <p
            role="alert"
            className="error-state m-4"
          >
            {error instanceof Error
              ? error.message
              : "Failed to load users."}
          </p>
        ) : (
          <>
            {/* Background Fetching */}
            {isFetching && (
              <p role="status" className="px-5 py-2 text-xs text-slate-500">
                Updating users...
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">User accounts, roles, and account status</caption>

                {/* Column Headings */}
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3">
                      Name
                    </th>

                    <th className="px-5 py-3">
                      Email
                    </th>

                    <th className="px-5 py-3">
                      Role
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* User Rows */}
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const roleNames = getRoleNames(user);

                    const rolesText =
                      roleNames.length > 0
                        ? roleNames.join(", ")
                        : "Not specified";

                    const isActive = isUserActive(user);

                    const hasStatus =
                      user.is_active !== undefined &&
                      user.is_active !== null;

                    const isAdminAccount =
                      roleNames.includes("administrator");

                    const isCurrentUser =
                      user.id === currentUserId;

                    const canChangeStatus =
                      !isCurrentUser &&
                      !isAdminAccount &&
                      hasStatus;

                    const isUpdatingThisUser =
                      isUpdatingStatus &&
                      updatingUser?.userId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50"
                      >
                        {/* Name */}
                        <td className="max-w-xs break-words px-5 py-4 font-medium text-slate-900">
                          {user.name}

                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600">
                              (You)
                            </span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="max-w-xs break-all px-5 py-4 text-slate-600">
                          {user.email}
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4 text-slate-600">
                          <span className="capitalize">{rolesText.replaceAll("_", " ")}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              !hasStatus
                                ? "border-slate-200 bg-slate-50 text-slate-600"
                                : isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {!hasStatus
                              ? "Unknown"
                              : isActive
                                ? "Active"
                                : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          {!canChangeStatus ? (
                            <span className="text-xs text-slate-400">
                              Unavailable
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                isUpdatingStatus ||
                                isFetching ||
                                isPlaceholderData
                              }
                              onClick={() => {
                                void handleStatusChange(user);
                              }}
                              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                                isActive
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              }`}
                            >
                              {isUpdatingThisUser
                                ? "Updating..."
                                : isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty Result */}
            {users.length === 0 && !isPlaceholderData && (
              <p className="p-8 text-center text-sm leading-6 text-slate-500">
                No users found.
                <span className="block">Try a different search or clear your filters.</span>
              </p>
            )}

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <span className="text-sm text-slate-500">
                Page {currentPage} of {lastPage}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.max(1, previous - 1)
                    )
                  }
                  disabled={
                    page <= 1 ||
                    isFetching ||
                    isUpdatingStatus
                  }
                  className="btn-secondary"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) => previous + 1)
                  }
                  disabled={
                    page >= lastPage ||
                    isFetching ||
                    isPlaceholderData ||
                    isUpdatingStatus
                  }
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
