# Adaptus — branded auth emails

By default, Supabase sends auth emails ("Magic Link", "Confirm signup") from a
**shared, unbranded sender** with generic copy that reads as *"some service called
Supabase wants you to sign in."* That's a trust-killer at the worst moment — the
very first touch — and the shared sender often lands in **spam**.

This folder fixes both halves: branded HTML **templates** + a branded **sender**.

---

## Part A — Brand the email body (5 min, do this first)

In **Supabase → Authentication → Email Templates**:

| Template in Supabase | Paste this file | Suggested subject |
| --- | --- | --- |
| **Magic link or OTP** | `magic-link.html` | `Your Adaptus sign-in link` |
| **Confirm signup** | `confirm-signup.html` | `Confirm your email to start using Adaptus` |

> ⚠️ **Clear the body box first (Ctrl+A → Delete) before pasting.** Supabase's
> editor strips `<!DOCTYPE>`/`<head>`/`<meta>` and table layouts, so these templates
> are **div-based fragments with inline styles only** — paste them exactly as-is and
> check the **Preview** tab. (If you see only an empty skeleton, the old table-based
> version leaked in — clear and re-paste.)

For each: pick the template on the left, replace the **Message body** with the file's
contents, set the **Subject**, and **Save**.

> The magic-link template is the important one — it's what `signInWithOtp`
> (the "Email me a sign-in link" button) sends. Confirm-signup only fires if you
> have **Confirm email** turned on under Authentication → Providers → Email.

**Don't touch the `{{ .ConfirmationURL }}` token** — Supabase fills it with the
real one-time link at send time. (Other available tokens: `{{ .SiteURL }}`,
`{{ .Email }}`, `{{ .Token }}` for a 6-digit OTP code.)

---

## Part B — Brand the *sender* + fix deliverability (the real trust fix)

A pretty email still looks sketchy if the **From** says
`noreply@mail.app.supabase.io` and it's sitting in spam. Supabase's built-in mailer
is also **rate-limited (a few emails/hour)** — fine for testing, not for real users.

Set up **custom SMTP** so mail comes **From: `Adaptus <hello@yourdomain.com>`**:

1. Pick an email provider with a free tier — **[Resend](https://resend.com)** is the
   easiest (3k emails/mo free), or SendGrid / Postmark / Mailgun / AWS SES.
2. **Verify your sending domain** in that provider (add the DKIM/SPF DNS records they
   give you). This is the single biggest factor in *not* getting spam-foldered.
3. In **Supabase → Project Settings → Authentication → SMTP Settings**: toggle
   **Enable Custom SMTP** and fill in:
   - **Sender name:** `Adaptus`
   - **Sender email:** `hello@yourdomain.com` (must be on the verified domain)
   - **Host / Port / Username / Password:** from your provider (Resend: host
     `smtp.resend.com`, port `465`, user `resend`, password = your API key).
4. Save and send yourself a test sign-in link.

> No custom domain yet? Resend lets you send from their `onboarding@resend.dev`
> sandbox to *your own* address for testing — enough to verify the templates look
> right before you wire up a real domain.

---

## Checklist

- [ ] Magic Link template pasted + subject set
- [ ] Confirm signup template pasted + subject set (if Confirm email is on)
- [ ] Custom SMTP enabled, sender = `Adaptus <…@yourdomain.com>`
- [ ] Sending domain verified (DKIM/SPF) so mail isn't flagged as spam
- [ ] Sent a real test link to a Gmail **and** an Outlook address and it landed in the inbox
