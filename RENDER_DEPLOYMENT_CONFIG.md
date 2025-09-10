# Render Deployment Configuration

## Environment Variables for Render

When deploying to Render, make sure to set these environment variables in your Render dashboard:

### Frontend Service Environment Variables:
```
VITE_FRONTEND_URL=https://compliance-manager-frontend.onrender.com
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
```

### Backend Service Environment Variables:
```
FRONTEND_URL=https://compliance-manager-frontend.onrender.com
```

## Xero OAuth Configuration

### 1. Update Xero App Settings
In your Xero Developer Portal, make sure your app has these redirect URIs:
- `https://compliance-manager-frontend.onrender.com/redirecturl`
- `https://compliance-manager-frontend.onrender.com/integrations/xero/callback`

### 2. Verify Domain Configuration
The application will automatically use the correct domain based on:
1. `VITE_FRONTEND_URL` environment variable (if set)
2. `window.location.origin` (current domain)
3. Fallback to `https://compliance-manager-frontend.onrender.com`

## Testing the OAuth Flow

1. Deploy both frontend and backend to Render
2. Set the environment variables above
3. Update your Xero app redirect URIs
4. Test the OAuth flow from the production URL

## Troubleshooting

If you're still getting localhost URLs in production:
1. Check that `VITE_FRONTEND_URL` is set correctly in Render
2. Verify the Xero app redirect URIs match your production domain
3. Check browser console for domain detection logs
4. Ensure both frontend and backend are using the same domain configuration
