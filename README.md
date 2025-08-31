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
- [ ] **TODO: Integrate newsletter preferences with Brevo service** - The user preferences system includes newsletter/marketing preferences but these need to be properly integrated with the Brevo email marketing service for full functionality
- [ ] Configure Auth Email Hook for custom OTP emails (see setup instructions below)
- [ ] Implement the cron job plan

## Database Development

### Type Generation

The project supports generating TypeScript types from local database:

- **TypeScript types only**: `bun supabase:db:types` - Generate TypeScript types from local database
- **Full pipeline**: `bun gen:types` - TypeScript types + Zod schemas + prefix removal

### Local Database Type Generation

For development, you can generate types from your local database using:

```bash
# Generate TypeScript types (ensures local database is running)
bun supabase:db:types

# Or run the database check script directly
bun ensure:nabostylisten-db
```

The `ensure:nabostylisten-db` script will:

1. Check that Docker is running
2. Verify the Nabostylisten database container is running
3. Exit with helpful error messages if prerequisites aren't met

Note: This script only verifies database availability - type generation is handled separately by the `supabase:db:types` command.

### Database Operations

- Create migrations: `bun supabase:db:diff <migration_name>`
- Apply migrations: `bun supabase:migrate:up`
- Reset local database: `bun supabase:db:reset`
- Push to production: `bun supabase:db:push`

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

## Testing OpenGraph Images

To test and preview OpenGraph images during development, use the **OGraph Previewer** browser extension:

1. **Install the extension**: [OGraph Previewer](https://chromewebstore.google.com/detail/ograph-previewer/ggcfeakcnodgcmmllfdbmngekljbhiim)

2. **Test your local development server**:
   - Start your development server: `bun dev`
   - Navigate to any page on `localhost:3000`
   - Click the OGraph Previewer extension icon
   - Preview how your page will appear on social media platforms

3. **Test specific routes**:
   - Homepage: `localhost:3000/`
   - Services: `localhost:3000/tjenester`
   - Individual service: `localhost:3000/tjenester/[service-id]`
   - Stylist profile: `localhost:3000/profiler/[stylist-id]`
   - Become stylist: `localhost:3000/bli-stylist`

This method is much simpler than using external tools like ngrok and provides immediate feedback during development.

