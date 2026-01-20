# Supabase Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization (or create one)
4. Set:
   - **Name:** `horizon-budget` (or any name)
   - **Database Password:** Generate a strong one and save it
   - **Region:** Choose closest to your users
5. Click "Create new project" and wait ~2 minutes

### Step 2: Run Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or Ctrl+Enter)
6. You should see "Success. No rows returned" - this is correct!

### Step 3: Enable Google OAuth

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google** ON
4. You'll need Google OAuth credentials:
   
   **Get Google Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

5. Back in Supabase, paste:
   - **Client ID** from Google
   - **Client Secret** from Google
6. Click **Save**

### Step 4: Configure App

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://abcd1234.supabase.co`)
   - **anon public** key (the long string)

3. Create `.env` file in project root:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Restart dev server:
   ```bash
   npm run dev
   ```

### Step 5: Test

1. Open http://localhost:5173
2. You should see **"Cloud Sync Enabled"** badge on login page
3. Try signing up with email or Google

---

## Troubleshooting

### "Supabase credentials not configured" warning
- Make sure `.env` file exists in project root
- Make sure variable names start with `VITE_`
- Restart the dev server after creating `.env`

### Google OAuth not working
- Check redirect URI matches exactly in Google Console
- Make sure Google provider is enabled in Supabase
- Check browser console for specific errors

### "Invalid API key" errors
- You might have copied the wrong key (use `anon` key, not `service_role`)
- Check for extra spaces in the `.env` file

---

## Security Notes

- The `anon` key is safe to expose in frontend code
- Row Level Security (RLS) protects all data
- Users can only access their own data
- Never expose the `service_role` key in frontend code
