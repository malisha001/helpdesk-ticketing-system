
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/lib/auth";

interface SidebarNavProps {
  roles: UserRole[];
}

interface NavLink {
  label: string;
  href: string;
}

export default function SidebarNav({
  roles,
}: SidebarNavProps) {
  const pathname = usePathname();

  const isAdministrator = roles.includes("administrator");
  const isSupportAgent = roles.includes("support_agent");
  const isCustomer = roles.includes("customer");

  const links: NavLink[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: isAdministrator
        ? "Manage Tickets"
        : isSupportAgent
          ? "Tickets"
          : "My Tickets",
      href: "/tickets",
    },
  ];

  if (isCustomer) {
    links.push({
      label: "Create Ticket",
      href: "/tickets/create",
    });
  }

  return (
    <nav className="space-y-2" aria-label="Main navigation">
      {links.map((link) => {
        const isActive =
          link.href === "/tickets"
            ? pathname === "/tickets" ||
              (pathname.startsWith("/tickets/") &&
                pathname !== "/tickets/create")
            : pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}

      {isAdministrator && (
        <span className="block cursor-not-allowed px-4 py-3 text-sm text-slate-500">
          Manage Users · Soon
        </span>
      )}
    </nav>
  );
}
