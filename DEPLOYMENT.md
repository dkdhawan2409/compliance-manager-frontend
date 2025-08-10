# 🚀 Deployment Guide

## 📋 Prerequisites

- Node.js 18+ installed
- Backend server running and accessible
- Hosting platform account (Vercel, Netlify, Render, etc.)

## 🔧 Configuration

### 1. Update Production API URL

Edit `deployment-config.js` and update the `PRODUCTION_API_URL`:

```javascript
PRODUCTION_API_URL: 'https://compliance-manager-backend.onrender.com/api'
```

### 2. Environment Variables

Set these environment variables in your hosting platform:

```bash
VITE_API_URL=https://compliance-manager-backend.onrender.com/api
VITE_APP_ENV=production
```

## 🚀 Deployment Steps

### Option 1: Using the Deployment Script

```bash
# Make sure you're in the frontend directory
cd frontend

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The dist/ folder contains your production build
```

## 📁 Build Output

After building, the `dist/` folder will contain:

```
dist/
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── ...
```

## 🌐 Hosting Platforms

### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify
1. Drag and drop the `dist/` folder
2. Set environment variables in Netlify dashboard
3. Configure redirects for SPA

### Render
1. Connect your GitHub repository
2. Set environment variables
3. Build command: `npm run build`
4. Publish directory: `dist`

## 🔧 Port Configuration

- **Frontend**: Port 3001 (development)
- **Backend**: Port 3333 (development)
- **Production**: Uses hosting platform's default ports

## 🔍 Troubleshooting

### Common Issues

1. **API URL not found**
   - Check environment variables are set correctly
   - Verify backend server is accessible

2. **Build fails**
   - Check Node.js version (18+ required)
   - Clear node_modules and reinstall

3. **CORS errors**
   - Ensure backend allows requests from your frontend domain
   - Check backend CORS configuration

### Debug Commands

```bash
# Check current configuration
node deployment-config.js

# Test API connectivity
curl https://your-backend-server.com/api/health

# Build with verbose output
npm run build --verbose
```

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify environment variables are set
3. Test backend connectivity
4. Review hosting platform logs

## ✅ Deployment Checklist

- [ ] Updated `PRODUCTION_API_URL` in deployment-config.js
- [ ] Set environment variables in hosting platform
- [ ] Backend server is running and accessible
- [ ] Built application successfully
- [ ] Uploaded dist/ folder to hosting platform
- [ ] Tested application functionality
- [ ] Verified API calls work correctly
