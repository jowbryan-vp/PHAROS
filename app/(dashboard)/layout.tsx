import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completo")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completo) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header email={user.email ?? null} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  );
}
