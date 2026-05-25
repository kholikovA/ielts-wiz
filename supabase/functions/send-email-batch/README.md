# send-email-batch

Admin-only batch transactional email via [Resend](https://resend.com).

## Deploy

```bash
# 1. Install the Supabase CLI if you haven't: https://supabase.com/docs/guides/cli
brew install supabase/tap/supabase   # macOS

# 2. Link this repo to the project (one-time).
supabase link --project-ref jaucbfremtxmanciflab

# 3. Set the Resend API key as a server secret.
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set RESEND_FROM='IELTS Wiz <hello@ielts-wiz.com>'

# 4. Deploy.
supabase functions deploy send-email-batch
```

## How it's called

The admin Users page (`/admin`) calls the function via the Supabase JS client:

```js
const { data, error } = await supabase.functions.invoke('send-email-batch', {
  body: { recipients, subject, bodyMd }
});
```

The function:
1. Validates the caller's JWT and looks up `profiles.is_admin`. Non-admins get 403.
2. Personalises each email with `{{name}}`, `{{target_score}}`, `{{email}}` placeholders.
3. Caps each batch at 500 recipients.
4. Returns `{ sent, failed, errors }`.

## Resend setup

1. Sign up at https://resend.com.
2. Add a domain (e.g. `ielts-wiz.com`) and follow the DNS instructions for SPF/DKIM. Sending from an unverified `from` will fail.
3. Generate an API key → paste it into `supabase secrets set RESEND_API_KEY=...`.

## Local development

```bash
supabase functions serve --no-verify-jwt send-email-batch
# Then invoke via:
curl -X POST http://localhost:54321/functions/v1/send-email-batch \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"recipients":[{"email":"you@example.com","name":"Test"}],"subject":"Hi","bodyMd":"hello"}'
```
