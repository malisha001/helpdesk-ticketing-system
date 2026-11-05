
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
    <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-900 px-4 py-5 text-white md:fixed md:inset-y-0 md:left-0 md:h-screen md:w-64 md:overflow-y-auto md:border-r md:px-5 md:py-6">
      {/* Application Name */}
      <p className="text-xl font-semibold tracking-tight text-white">
        HelpDesk
      </p>
      <p className="mt-1 text-xs text-slate-400">Support workspace</p>

      {/* Navigation */}
      <div className="mt-6 flex-1">
        <SidebarNav roles={user.roles} />
      </div>

      {/* Current User and Logout */}
      <div className="mt-6 border-t border-slate-800 pt-5">
        <div className="mb-4 min-w-0">
          <p className="break-words text-sm font-semibold text-white">
            {user.name}
          </p>
          <p className="mt-1 text-xs font-medium text-blue-300">
            {user.roles
              .map((role) => roleLabels[role])}
          </p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
