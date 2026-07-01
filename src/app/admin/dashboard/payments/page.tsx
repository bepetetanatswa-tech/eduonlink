import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaymentsClient } from "./PaymentsClient";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase.from("payment_verifications") as any)
    .select("id, amount, status, phone_number, transaction_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return <PaymentsClient initialPayments={payments ?? []} />;
}
