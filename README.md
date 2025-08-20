# Nabostylisten

## TODO when porting over

- [ ] Create new Supabase project
- [ ] In package.json and env local set the supabase keys and project id
- [ ] Setup sign in with Google
- [ ] Create google project
- [ ] Fully setup Stripe sync engine after moving projects
- [ ] Add Mapbox access token: <https://docs.mapbox.com/mapbox-search-js/api/react/autofill/>
- [ ] Add Posthog environment variables
- [ ] Setup Brevo Newsletter and add API key
- [ ] Configure Auth Email Hook for custom OTP emails (see setup instructions below)

## Auth Email Hook Setup

The project uses Supabase Edge Functions with Resend and React Email to send custom branded OTP emails instead of the default Supabase auth emails.

### Why Use Custom Auth Emails?

- **Brand consistency**: Emails match Nabostylisten's visual identity and Norwegian language
- **Better user experience**: Custom styling and clear Norwegian instructions
- **Security**: Only sends OTP token (no magic link) for better security
- **Professional appearance**: Custom domain and sender name

### Setup Instructions

After deploying the `send-otp-email` Edge Function, you need to configure the Auth Email Hook in your new Supabase project:

1. **Deploy the Edge Function** (already done):

   ```bash
   supabase functions deploy send-otp-email --no-verify-jwt
   ```

2. **Configure Auth Hook in Supabase Dashboard**:

   - Go to **Authentication > Hooks** in your Supabase dashboard
   - Click **Create a new hook**
   - Select **Send Email Hook**
   - Set hook type to **HTTPS**
   - Enter the function URL: `https://[PROJECT_ID].supabase.co/functions/v1/send-otp-email`
   - Click **Generate Secret** and save the base64 secret (remove the `v1,whsec_` prefix)

3. **Set Environment Variables**:
   Add these secrets to your Supabase Edge Function environment:

   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   supabase secrets set SEND_EMAIL_HOOK_SECRET=your_base64_secret_without_prefix
   ```

4. **Verify Domain in Resend**:
   - Verify `nabostylisten.no` domain in your Resend dashboard
   - Update the `from` field in the Edge Function if using a different domain

### Reference Documentation

For detailed implementation guidance, see: [Custom Auth Emails with React Email and Resend](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend)
