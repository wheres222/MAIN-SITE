import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free Cheat Paradise account for instant delivery, order tracking, account balance, and 24/7 support.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/register" },
};

/**
 * Only same-origin paths are honoured. `next` arrives in the URL and ends up in
 * a redirect, so accepting `https://elsewhere.example` would turn this page into
 * an open redirect — a phishing primitive that borrows our domain's
 * credibility. Anything not starting with a single `/` falls back to /account.
 */
function safeNext(value: string | undefined): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthPage defaultTab="register" next={safeNext(next)} />;
}
