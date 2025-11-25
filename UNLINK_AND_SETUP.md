# Project: Unlinked & Supabase setup

This workspace was prepared so you can use the project with your own Supabase instance and start a _new_ Git repository.

Steps to get the project ready for your own Supabase keys and repo:

1. Add your Supabase credentials
   - Copy `.env.local.example` to `.env.local`:
     ```powershell
     copy .env.local.example .env.local
     ```
   - Edit `.env.local` and set:
     - NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
     - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
     - SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>  # server-only

2. Initialize a new Git repository (optional)
   ```powershell
   git init
   git add .
   git commit -m "Initial import — updated Supabase placeholders"
   # optionally add a remote and push
   git remote add origin https://github.com/youruser/your-new-repo.git
   git branch -M main
   git push -u origin main
   ```

3. Running locally
   - Install dependencies: `npm install`
   - Run development server: `npm run dev`

Notes
- Sensitive keys should never be committed. This workspace now uses environment variables and the `.env.local.example` provides a template.
- If you want to completely remove any previous secret traces from files or history, use the `git filter-repo` tool before pushing to a public remote (not necessary here because the repo metadata was removed in this workspace).
