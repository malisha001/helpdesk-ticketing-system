import { redirect } from "next/navigation";

import CreateAgentForm from "@/features/users/CreateAgentForm";
import { getCurrentUser } from "@/lib/auth";

export default async function CreateAgentPage() {
  const user = await getCurrentUser();

  if (!user.roles.includes("administrator")) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell">
      <CreateAgentForm />
    </main>
  );
}
