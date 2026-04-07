# Deployment Guide - Vercel

## Prerequisites

1. Vercel account (https://vercel.com)
2. GitHub repository (https://github.com/Luquinharx/DashDead)
3. Environment variables configured

## Quick Start

### Option 1: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts and connect your GitHub repository.

### Option 2: Deploy via GitHub Integration

1. Go to https://vercel.com/new
2. Select "Other - Existing Git Repository"
3. Import the DashDead repository
4. Project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install` (or uses package-lock.json)

## Environment Variables

Add these to Vercel project settings (**Settings → Environment Variables**):

```
VITE_FIREBASE_API_KEY=AIzaSyA9E6Hrkbfnex1YvxJVplbf49RdEa8dcMc
VITE_FIREBASE_AUTH_DOMAIN=deadbb-2d5a8.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://deadbb-2d5a8-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=deadbb-2d5a8
VITE_FIREBASE_STORAGE_BUCKET=deadbb-2d5a8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1056561339291
VITE_FIREBASE_APP_ID=1:1056561339291:web:dead2698f85ad9875bdf3e
VITE_FIREBASE_MEASUREMENT_ID=G-ZDKPF5W6D4
```

**Set for all environments:**
- ✅ Production
- ✅ Preview  
- ✅ Development

## Post-Deployment

1. Verify frontend loads correctly
2. Test Firebase authentication
3. Check console for any errors
4. Monitor Vercel analytics dashboard

## Troubleshooting

**Build fails with "Cannot find module":**
- Check `frontend/package.json` has all dependencies
- Run `npm install` locally first

**Environment variables not loaded:**
- Verify variable names start with `VITE_`
- Redeploy after adding/changing env vars

**SPA routing not working:**
- vercel.json has rewrites configured
- All routes redirect to `/index.html`

## Automatic Deployments

- **Main branch** auto-deploys to production
- **Pull requests** get preview deployments
- Every push to `main` triggers new build

## Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/build.html)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
