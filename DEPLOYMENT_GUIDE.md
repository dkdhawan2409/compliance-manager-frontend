# Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables
Set these environment variables in your production environment:

```bash
# REQUIRED: Backend API URL
VITE_API_URL=https://your-backend-domain.com/api

# OPTIONAL: Frontend URL (will auto-detect if not set)
VITE_FRONTEND_URL=https://your-frontend-domain.com

# Environment
NODE_ENV=production
```

### 2. Build Commands
Use the production build command:

```bash
# Clean production build
npm run build:prod

# Or standard build (will use production defaults)
npm run build
```

### 3. Verify No Localhost URLs
The build process will automatically:
- ✅ Use production API URLs
- ✅ Auto-detect frontend domain
- ✅ Throw errors if localhost URLs are found in production
- ✅ Use dynamic OAuth redirect URLs

### 4. Xero App Configuration
Update your Xero app in the developer portal:
- Redirect URI: `https://your-domain.com/redirecturl`
- Remove any localhost redirect URIs

### 5. Deployment Steps

1. **Set Environment Variables** in your hosting platform
2. **Run Production Build**: `npm run build:prod`
3. **Deploy** the `dist/` folder
4. **Verify** OAuth redirects work with your domain

### 6. Verification Commands

```bash
# Check for any remaining localhost references
grep -r "localhost" dist/

# Should return no results for production builds
```

### 7. Common Issues

❌ **Error**: "Production build cannot contain localhost URLs"
- **Solution**: Set `VITE_API_URL` environment variable

❌ **Error**: OAuth redirects to localhost
- **Solution**: Update Xero app redirect URI to your production domain

❌ **Error**: API calls fail
- **Solution**: Ensure `VITE_API_URL` points to your production backend

## 🔧 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| API URL | `http://localhost:3333/api` | `https://your-backend.com/api` |
| Frontend | `http://localhost:3000` | `https://your-domain.com` |
| OAuth Redirect | `http://localhost:3000/redirecturl` | `https://your-domain.com/redirecturl` |
| Build Command | `npm run dev` | `npm run build:prod` |

## 🛡️ Safety Features

The application includes automatic safety checks:
- ✅ Production builds cannot contain localhost URLs
- ✅ Environment variables are validated
- ✅ OAuth redirects use current domain
- ✅ API URLs are environment-aware
