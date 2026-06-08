import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free Cheat Paradise account for instant delivery, order tracking, account balance, and 24/7 support.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return <AuthPage defaultTab="register" />;
}
