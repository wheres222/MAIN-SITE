import { redirect } from "next/navigation";

/**
 * /login is now a thin redirect that bounces users to the homepage with
 * `?auth=login`, which the SiteHeader picks up and opens the AuthModal popup.
 * Keeps a single auth UI (the modal) instead of maintaining a duplicate
 * full-page route, and means login and register share identical styling.
 *
 * Any inbound traffic (search engines, old bookmarks, password reset emails)
 * still arrives at /login and gets the popup automatically.
 */
export default function LoginRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  // Preserve `?next=` if present so users land on their intended page post-login.
  if (searchParams) {
    return <AsyncRedirect searchParams={searchParams} />;
  }
  redirect("/?auth=login");
}

async function AsyncRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
  redirect(`/?auth=login${next}`);
}
