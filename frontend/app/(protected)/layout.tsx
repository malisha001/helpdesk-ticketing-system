import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import AppSidebar from "@/components/layout/AppSidebar";
import { connection } from "next/server";

interface ProtectedLayoutProps {
  children: ReactNode;
}

async function ProtectedShell({
  children,
}: ProtectedLayoutProps) {
// Wait for an incoming request before rendering
  await connection();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <AppSidebar user={user} />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 p-8">
          <p className="text-gray-600">
            Loading application...
          </p>
        </div>
      }
    >
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}
