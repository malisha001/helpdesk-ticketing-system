import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import ManageUsers from "@/features/users/ManageUsers";

export default async function ManageUsersPage() {
  const user = await getCurrentUser();

  if (!user.roles.includes("administrator")) {
    redirect("/dashboard");
  }

  return <ManageUsers currentUserId={user.id} />;
}
