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

  // Customer navigation
  if (isCustomer) {
    links.push({
      label: "Create Ticket",
      href: "/tickets/create",
    });
  }

  // Administrator navigation
  if (isAdministrator) {
    links.push({
      label: "Manage Users",
      href: "/users",
    });
  }

  return (
    <nav className="grid grid-cols-2 gap-1 md:grid-cols-1" aria-label="Main navigation">
      {links.map((link) => {
        const isActive =
          link.href === "/tickets"
            ? pathname === "/tickets" ||
              (pathname.startsWith("/tickets/") &&
                pathname !== "/tickets/create")
            : pathname === link.href ||
              pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
