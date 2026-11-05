import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import TicketDetails from "@/features/tickets/TicketDetails";

interface TicketDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function TicketDetailsContent({ params }: TicketDetailsPageProps) {
  const { id } = await params;

  // Validate the user session
  await getCurrentUser();

  return (
    <main className="page-shell">
      <TicketDetails ticketId={id} />
    </main>
  );
}

export default function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  return (
    <Suspense
      fallback={<p role="status" className="page-shell text-sm text-slate-500">Loading ticket page...</p>}
    >
      <TicketDetailsContent params={params} />
    </Suspense>
  );
}
