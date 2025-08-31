import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { DiscountsPageContent } from "@/components/admin/discounts-page-content";

export default async function DiscountsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    redirect("/auth/login");
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/auth/unauthorized");
  }

  return (
    <AdminLayout>
      <DiscountsPageContent />
    </AdminLayout>
  );
}