import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import AppSidebar from "@/components/layout/AppSidebar";
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
      <div className="min-h-screen bg-slate-100 md:flex">
        <AppSidebar user={user} />

        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}

export default function ProtectedLayout({children}: ProtectedLayoutProps) {
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
