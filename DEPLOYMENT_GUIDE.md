# 🚀 Production Deployment Guide

## 📋 **Overview**

This guide will help you deploy the AI Compliance Management System to production with proper configuration and optimization.

## 🔧 **Prerequisites**

### **System Requirements**
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Web Server**: Nginx, Apache, or cloud hosting platform
- **SSL Certificate**: For HTTPS (required for production)

### **API Keys Required**
- **OpenAI API Key**: For AI functionality
- **Xero App Credentials**: For Xero integration (optional)

## 🎯 **Quick Deployment Options**

### **Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **Option 2: Netlify**
```bash
# Build the project
npm run build

# Deploy to Netlify
# Drag and drop the 'dist' folder to Netlify
```

### **Option 3: Traditional Server**
```bash
# Build the project
npm run build

# Copy dist folder to web server
sudo cp -r dist/* /var/www/html/
```

## ⚙️ **Environment Configuration**

### **Required Environment Variables**

Create a `.env` file in your project root or set these in your hosting platform:

```bash
# API Configuration
VITE_API_URL=https://your-backend-domain.com/api
VITE_FRONTEND_URL=https://your-frontend-domain.com

# OpenAI Configuration (CRITICAL)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# Xero Configuration (Optional)
VITE_XERO_CLIENT_ID=your-xero-client-id
VITE_XERO_CLIENT_SECRET=your-xero-client-secret
```

### **Hosting Platform Setup**

#### **Vercel**
1. Go to Project Settings → Environment Variables
2. Add `VITE_OPENAI_API_KEY` with your OpenAI API key
3. Add other environment variables as needed

#### **Netlify**
1. Go to Site Settings → Environment Variables
2. Add `VITE_OPENAI_API_KEY` with your OpenAI API key
3. Add other environment variables as needed

#### **Traditional Server**
1. Create `.env` file in project root
2. Add environment variables
3. Ensure file is not committed to git

## 🔒 **Security Configuration**

### **SSL Certificate**
- **Required**: HTTPS for production
- **Options**: Let's Encrypt (free), paid certificates
- **Auto-renewal**: Set up automatic renewal

### **Security Headers**
The application includes security headers, but ensure your server adds:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
add_header Strict-Transport-Security "max-age=31536000";
```

### **API Key Security**
- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** for security

## 📦 **Build Process**

### **Local Build**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview
```

### **Build Output**
- **Location**: `dist/` folder
- **Size**: ~1.3MB (gzipped)
- **Files**: HTML, CSS, JS, assets

### **Build Optimization**
- **Code splitting**: Automatic
- **Tree shaking**: Enabled
- **Minification**: Enabled
- **Gzip compression**: Enabled

## 🌐 **Domain Configuration**

### **Custom Domain Setup**
1. **DNS Configuration**: Point domain to hosting provider
2. **SSL Certificate**: Install SSL certificate
3. **Redirects**: Set up www to non-www redirects

### **Subdomain Setup**
- **app.yourdomain.com**: Main application
- **api.yourdomain.com**: Backend API (if separate)

## 🔄 **Deployment Process**

### **Step 1: Prepare Environment**
```bash
# Clone repository
git clone <your-repo>
cd compliance-management-system/frontend

# Install dependencies
npm install
```

### **Step 2: Configure Environment**
```bash
# Create environment file
cp env.production.example .env

# Edit environment variables
nano .env
```

### **Step 3: Build and Deploy**
```bash
# Build for production
npm run build

# Deploy (choose your method)
# - Upload dist/ folder to hosting
# - Use hosting platform CLI
# - Use CI/CD pipeline
```

### **Step 4: Verify Deployment**
1. **Check website**: Visit your domain
2. **Test AI chat**: Verify OpenAI integration works
3. **Check console**: No errors in browser console
4. **Test features**: All functionality working

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Global AI configuration not available"**
**Solution**: Set `VITE_OPENAI_API_KEY` environment variable
```bash
# Check if environment variable is set
echo $VITE_OPENAI_API_KEY

# Set environment variable
export VITE_OPENAI_API_KEY=sk-your-key-here
```

#### **Build Failures**
**Solution**: Check Node.js version and dependencies
```bash
# Check Node.js version
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **API Connection Issues**
**Solution**: Verify backend URL and CORS settings
```bash
# Check API URL in environment
echo $VITE_API_URL

# Test API endpoint
curl https://your-backend-domain.com/api/health
```

#### **Xero Integration Issues**
**Solution**: Verify Xero app configuration
1. Check Xero app settings
2. Verify redirect URIs
3. Ensure OAuth scopes are correct

### **Performance Issues**
- **Enable gzip compression**
- **Use CDN for static assets**
- **Optimize images**
- **Enable browser caching**

## 📊 **Monitoring and Maintenance**

### **Health Checks**
- **Website**: Regular uptime monitoring
- **API**: Backend health monitoring
- **SSL**: Certificate expiration monitoring

### **Performance Monitoring**
- **Page load times**: Monitor Core Web Vitals
- **API response times**: Monitor backend performance
- **Error rates**: Monitor application errors

### **Security Monitoring**
- **SSL certificate**: Monitor expiration
- **API usage**: Monitor OpenAI API usage
- **Access logs**: Monitor for suspicious activity

## 🔄 **Updates and Maintenance**

### **Regular Updates**
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### **Deployment Updates**
1. **Pull latest code**: `git pull origin main`
2. **Update dependencies**: `npm install`
3. **Build**: `npm run build`
4. **Deploy**: Upload new build
5. **Test**: Verify functionality

## 📞 **Support**

### **Getting Help**
- **Documentation**: Check project README
- **Issues**: Create GitHub issue
- **Community**: Check project discussions

### **Emergency Contacts**
- **Hosting Provider**: Contact hosting support
- **Domain Provider**: Contact domain registrar
- **SSL Provider**: Contact certificate provider

---

## ✅ **Deployment Checklist**

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Build successful
- [ ] Website accessible
- [ ] AI chat working
- [ ] Xero integration working (if applicable)
- [ ] Error monitoring set up
- [ ] Performance monitoring set up
- [ ] Backup strategy in place

**Your AI Compliance Management System is now ready for production! 🎉**
