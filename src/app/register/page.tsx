import { redirect } from "next/navigation";

/**
 * /register is now a thin redirect to /?auth=register, which the SiteHeader
 * picks up and opens the AuthModal popup. Same reasoning as the /login
 * redirect — one auth UI, consistent styling.
 */
export default function RegisterRedirect() {
  redirect("/?auth=register");
}
