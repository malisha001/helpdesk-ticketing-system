
import Link from "next/link";
import type { AuthUser, UserRole } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

interface AppSidebarProps {
  user: AuthUser;
}

const roleNavigation: Record<UserRole, string[]> = {
  customer: [
    "My Tickets",
    "Create Ticket",
  ],
  support_agent: [
    "Ticket Queue",
    "Assigned Tickets",
  ],
  administrator: [
    "All Tickets",
    "Manage Users",
    "Assign Tickets",
  ],
};

export default function AppSidebar({
  user,
}: AppSidebarProps) {
  const role: UserRole | undefined =
    user.roles.includes("administrator")
      ? "administrator"
      : user.roles.includes("support_agent")
        ? "support_agent"
        : user.roles.includes("customer")
          ? "customer"
          : undefined;

  const menuItems = role ? roleNavigation[role] : [];

  return (
    <aside className="flex w-full flex-col gap-6 bg-slate-900 p-5 text-white md:min-h-screen md:w-64">

      {/* Application Name */}
      <Link
        href="/dashboard"
        className="text-2xl font-bold text-blue-400"
      >
        HelpDesk
      </Link>

      {/* Current User */}
      <div className="border-b border-slate-700 pb-4">
        <p className="font-semibold">{user.name}</p>

        <p className="mt-1 break-all text-xs text-slate-400">
          {user.email}
        </p>

        <p className="mt-2 text-sm capitalize text-blue-300">
          {role?.replaceAll("_", " ") ?? "No role"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg bg-slate-800 px-4 py-3 text-sm hover:bg-slate-700"
        >
          Dashboard
        </Link>

        
{menuItems.map((item) => {
  const ticketListItems = [
    "My Tickets",
    "Ticket Queue",
    "All Tickets",
  ];

    if (ticketListItems.includes(item)) {
        return (
        <Link
            key={item}
            href="/tickets"
            className="rounded-lg px-4 py-3 text-sm hover:bg-slate-700"
        >
            {item}
        </Link>
        );
    }
  
    if (item === "Create Ticket") {
    return (
        <Link
        key={item}
        href="/tickets/create"
        className="rounded-lg px-4 py-3 text-sm hover:bg-slate-700"
        >
        {item}
        </Link>
    );
    }

    return (
        <div
        key={item}
        className="rounded-lg px-4 py-3 text-sm text-slate-400"
        >
        {item} · Soon
        </div>
    );
    })}

      </nav>

      {/* Logout */}
      <LogoutButton />
    </aside>
  );
}
