
import { Suspense } from "react";
import { getCurrentUser, type UserRole } from "@/lib/auth";

// Dashboard content
async function DashboardContent() {
  const user = await getCurrentUser();

  let role: UserRole | undefined;

  if (user.roles.includes("administrator")) {
    role = "administrator";
  } else if (user.roles.includes("support_agent")) {
    role = "support_agent";
  } else if (user.roles.includes("customer")) {
    role = "customer";
  }

  const dashboardInfo: Record<
    UserRole,
    { title: string; description: string }
  > = {
    customer: {
      title: "Customer Dashboard",
      description: "Create and track your support tickets.",
    },
    support_agent: {
      title: "Support Agent Dashboard",
      description: "Manage assigned tickets and customer requests.",
    },
    administrator: {
      title: "Administrator Dashboard",
      description: "Manage tickets, users, and support agents.",
    },
  };

  return (
    <main className="p-8">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm text-gray-500">
          Welcome back, {user.name}
        </p>

        {role ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              {dashboardInfo[role].title}
            </h1>

            <p className="mt-3 text-gray-600">
              {dashboardInfo[role].description}
            </p>
          </>
        ) : (
          <p className="text-red-600">
            No recognized role assigned.
          </p>
        )}
      </div>
    </main>
  );
}

// Default export required by Next.js
export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading dashboard...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
