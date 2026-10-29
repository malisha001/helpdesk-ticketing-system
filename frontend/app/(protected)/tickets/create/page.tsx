import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CreateTicketForm from "@/features/tickets/CreateTicketForm";

async function CustomerCreateTicket() {
  const user = await getCurrentUser();

  // This page is intended for customers
  if (!user.roles.includes("customer")) {
    redirect("/dashboard");
  }

  return (
    <main className="p-6">
      <CreateTicketForm />
    </main>
  );
}

export default function CreateTicketPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <CustomerCreateTicket />
    </Suspense>
  );
}
