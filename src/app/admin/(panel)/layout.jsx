import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminPanelLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
    Middleware redirects unauthenticated visitors already,
    but this server-side check is still required.
  */
  if (!user) {
    redirect("/admin/login");
  }

  /*
    profiles table:
    id        uuid = auth.users.id
    full_name text
    role      text = admin / staff
  */
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  /*
    Only role = admin can use the panel.
    We will create this profiles table and its RLS policies
    in the next step.
  */
  if (error || !profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-authorized");
  }

  return (
    <AdminShell
      adminName={profile.full_name || user.email || "Admin"}
      adminEmail={user.email || ""}
    >
      {children}
    </AdminShell>
  );
}