# Auth email templates

Supabase sends these, not the app. The transactional emails the app sends
itself — order keys, deposit confirmations — live in `src/lib/email.ts` and go
through Resend's API rather than SMTP.

## Where they go

Supabase Dashboard → Authentication → Emails → Templates. Pick the template,
paste the file's contents into **Message body**, save. One at a time.

| File | Template | Sent when |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Someone registers |
| `reset-password.html` | Reset password | Someone requests a password reset |
| `change-email.html` | Change Email Address | A user changes their email — goes to **both** addresses |
| `magic-link.html` | Magic Link | Only if passwordless sign-in is enabled under Providers → Email |

The HTML comment at the top of each file is a note to whoever is pasting it and
can be left in or stripped — mail clients ignore it either way.

## Why they are written this way

Tables and inline styles, not flexbox and a stylesheet. Outlook renders through
Word's HTML engine, which supports neither, and a layout that collapses in
Outlook is a confirmation email a customer cannot use.

Colours match the site: `#0a0a0b` page, `#101012` card, `#e01530` accent.

## The variables

`{{ .ConfirmationURL }}` routes through Supabase's verify endpoint, which
redeems the token and forwards to the app's redirect URL. Keep it as-is.
`{{ .TokenHash }}` also works — `src/app/api/auth/callback/route.ts` handles
both — but the URL form needs no template surgery.

`{{ .Email }}` is the recipient. `{{ .NewEmail }}` exists only in the change-email
template. `{{ .SiteURL }}` is the project's configured site URL.

## Before any of this works

Custom SMTP has to be configured under Project Settings → Authentication → SMTP
Settings. Supabase's built-in mailer only delivers to members of your own
organisation, which is why signups from real customers were silently going
nowhere.
