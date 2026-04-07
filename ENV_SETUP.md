# Environment Setup Guide

## Local Development

1. Create a `.env.local` file in the `frontend/` directory using `.env.example` as template:

```bash
cp frontend/.env.example frontend/.env.local
```

2. Update the values with your actual Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_actual_domain
VITE_FIREBASE_DATABASE_URL=your_actual_database_url
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
```

## Vercel Deployment

Add these environment variables in your Vercel project settings:

**Project Settings → Environment Variables**

```
VITE_FIREBASE_API_KEY = AIzaSyA9E6Hrkbfnex1YvxJVplbf49RdEa8dcMc
VITE_FIREBASE_AUTH_DOMAIN = deadbb-2d5a8.firebaseapp.com
VITE_FIREBASE_DATABASE_URL = https://deadbb-2d5a8-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID = deadbb-2d5a8
VITE_FIREBASE_STORAGE_BUCKET = deadbb-2d5a8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 1056561339291
VITE_FIREBASE_APP_ID = 1:1056561339291:web:dead2698f85ad9875bdf3e
VITE_FIREBASE_MEASUREMENT_ID = G-ZDKPF5W6D4
```

Make sure to set these for:
- ✅ Production
- ✅ Preview
- ✅ Development

## Important Notes

- ⚠️ **Never commit `.env.local`** - It's already in `.gitignore`
- ✅ **`.env.example`** is safe to commit - it shows structure without secrets
- 📝 Update `.env.example` when adding new variables
- 🔐 Keep your API keys secure - don't share them in git history

## Backend (scraper_v2.py)

The Python scraper runs locally and doesn't require Vercel environment variables.
It pushes data directly to Firebase using the configured credentials in the Firebase console.
