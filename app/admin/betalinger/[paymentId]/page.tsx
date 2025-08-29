import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/permissions";
import { AdminLayout } from "@/components/admin-layout";
import { PaymentDetailsContent } from "@/components/admin/payment-details-content";

interface AdminPaymentDetailsPageProps {
  params: {
    paymentId: string;
  };
}

export default async function AdminPaymentDetailsPage({ 
  params 
}: AdminPaymentDetailsPageProps) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/auth/login");
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (!isAdmin(profile.role)) {
    redirect("/");
  }

  return (
    <AdminLayout>
      <PaymentDetailsContent paymentId={params.paymentId} />
    </AdminLayout>
  );
}