import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Cheat Paradise account to access your dashboard, orders, balance, and downloads.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  // Rejects "//evil.example" as well as absolute URLs — a protocol-relative
  // path passes a bare startsWith("/") check and still leaves the site.
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/account";
  return <AuthPage defaultTab="login" next={next} initialError={params.error ?? ""} />;
}
