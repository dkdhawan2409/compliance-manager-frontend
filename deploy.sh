#!/bin/bash

# Deployment Script for Production
echo "🚀 Starting deployment process..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Build output is in the 'dist/' directory"
    echo ""
    echo "🚀 Next steps for deployment:"
    echo "1. Upload the contents of 'dist/' to your hosting platform"
    echo "2. Set environment variable VITE_API_URL to your backend server URL"
    echo "3. Ensure your backend server is running and accessible"
    echo ""
    echo "🔧 Configuration:"
    echo "   - Frontend will run on port 3001"
    echo "   - Backend should be accessible at your server URL"
    echo "   - Update VITE_API_URL in your hosting platform"
    echo ""
    echo "📋 Example environment variables:"
    echo "   VITE_API_URL=https://your-backend-server.com/api"
    echo ""
    echo "🌐 Your application is ready for deployment!"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi
