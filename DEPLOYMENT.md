# Deployment Guide

## Prerequisites

- GitHub account
- Supabase project (already set up)
- Vercel or Netlify account
- Domain (optional)

## Step 1: Database Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project → SQL Editor
3. Run `supabase/schema.sql` to create tables
4. Run `supabase/seed.sql` to add sample data (optional)

## Step 2: Get Supabase Keys

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (⚠️ Keep secret!)

## Step 3: Generate Admin Password Hash

```bash
npx bcryptjs "your-secure-password" 10
```

Copy the output to `ADMIN_PASSWORD_HASH`

## Step 4: Generate JWT Secret

```bash
openssl rand -base64 32
```

Copy the output to `JWT_SECRET`

## Step 5: Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/charlestonbonsai.git
   git push -u origin main
   ```

2. Go to [Vercel](https://vercel.com) → Import Project

3. Select your GitHub repository

4. Add environment variables:
   | Variable | Value |
   |----------|-------|
   | `SUPABASE_URL` | Your Supabase URL |
   | `SUPABASE_ANON_KEY` | Your anon key |
   | `SUPABASE_SERVICE_KEY` | Your service role key |
   | `ADMIN_EMAIL` | curt.blanton@gmail.com |
   | `ADMIN_PASSWORD_HASH` | Your generated hash |
   | `JWT_SECRET` | Your generated secret |
   | `SITE_URL` | https://your-domain.com |

5. Click Deploy

## Step 6: Custom Domain (Optional)

### In Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### DNS Configuration:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Post-Deployment Checklist

- [ ] Visit site and verify homepage loads
- [ ] Test gallery page with filters
- [ ] Test product detail page
- [ ] Test admin login at `/admin/login`
- [ ] Create a test listing
- [ ] Edit and delete test listing
- [ ] Verify 3D viewer works (if models uploaded)
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit

## Troubleshooting

### Build Errors

**Missing dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
npm run typecheck
```

### Runtime Errors

**Supabase connection fails:**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused

**Admin login fails:**
- Verify `ADMIN_PASSWORD_HASH` is correct
- Check `JWT_SECRET` is set
- Ensure `SUPABASE_SERVICE_KEY` is set (not anon key)

### 3D Models Not Loading

- Ensure models are in GLTF/GLB format
- Check CORS settings on model host
- Verify model URL is accessible

## Monitoring

### Vercel Analytics
1. Go to Project → Analytics
2. Enable Web Analytics

### Error Tracking
Consider adding Sentry:
```bash
npm install @sentry/nuxt
```

## Updates

To update the site:
```bash
git add .
git commit -m "your changes"
git push
```

Vercel will automatically redeploy.

## Rollback

In Vercel:
1. Go to Deployments
2. Find the last working deployment
3. Click "..." → Promote to Production
