import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import AppSidebar from "@/components/layout/AppSidebar";
import NotificationBell from "@/components/layout/NotificationBell";
import AuthProvider from "@/components/providers/AuthProvider";

//ReactNode - children property can contain React-renderable content.including JSX elements, strings, numbers, arrays. 
interface ProtectedLayoutProps {
  children: ReactNode;
}

async function ProtectedShell({children}: ProtectedLayoutProps) {
  await connection();

  // Server-side session validation
  const user = await getCurrentUser();

  return (
    <AuthProvider initialUser={user}>
      <div className="min-h-screen bg-slate-50 md:flex">
        <AppSidebar user={user} />

        <div className="min-w-0 flex-1 md:ml-64">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
            <NotificationBell userId={user.id} />
          </header>

          <div className="min-w-0">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

export default function ProtectedLayout({children}: ProtectedLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <p role="status" className="panel p-6 text-sm text-slate-500">
            Loading application...
          </p>
        </div>
      }
    >
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}
