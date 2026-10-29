
import type { AuthUser, UserRole } from "@/lib/auth";

import SidebarNav from "./SidebarNav";
import LogoutButton from "./LogoutButton";

interface AppSidebarProps {
  user: AuthUser;
}

const roleLabels: Record<UserRole, string> = {
  customer: "Customer",
  support_agent: "Support Agent",
  administrator: "Administrator",
};

export default function AppSidebar({
  user,
}: AppSidebarProps) {
  return (
    <aside className="flex w-full flex-col bg-slate-900 px-5 py-6 text-white md:min-h-screen md:w-64 md:shrink-0">

      {/* Application Name */}
      <h1 className="text-2xl font-bold text-blue-400">
        HelpDesk
      </h1>

      {/* Current User Information */}
      <div className="mt-8 border-b border-slate-700 pb-5">
        <p className="font-semibold text-white">
          {user.name}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {user.email}
        </p>

        <p className="mt-2 text-sm text-blue-400">
          {user.roles
            .map((role) => roleLabels[role])
            .join(", ")}
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-6">
        <SidebarNav roles={user.roles} />
      </div>

      {/* Logout */}
      <div className="mt-auto pt-8">
        <LogoutButton />
      </div>

    </aside>
  );
}
