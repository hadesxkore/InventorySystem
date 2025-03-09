# Netlify Deployment Guide for Inventory Management System

This guide will help you deploy both your frontend (Next.js) and backend (Express) to Netlify.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com) if you don't have one)
2. Your project pushed to a GitHub repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure all the changes we've made are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Prepare project for Netlify deployment"
git push
```

### 2. Connect Your Repository to Netlify

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Select GitHub as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your Inventory Management System repository

### 3. Configure Build Settings

When configuring your site, use these settings:

- **Base directory**: Leave empty (we've specified it in netlify.toml)
- **Build command**: Leave empty (we've specified it in netlify.toml)
- **Publish directory**: Leave empty (we've specified it in netlify.toml)

### 4. Configure Environment Variables

Add the following environment variables in the Netlify UI (Site settings > Environment variables):

#### For Frontend:
- `NEXT_PUBLIC_API_URL`: `/.netlify/functions/server/api`
- `NEXT_PUBLIC_FIREBASE_API_KEY`: `AIzaSyAts6Y-V0gEhbpG3oYH6BcHZTgDDwXiq3s`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `inventorysystem-cc10f.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `inventorysystem-cc10f`

#### For Backend:
- `MONGODB_URI`: `mongodb+srv://Kobie:Villanueva23@cluster0.mdzo3.mongodb.net/inventory_system`
- `JWT_SECRET`: `inventory_system_secure_jwt_secret_key_2024`
- `NODE_ENV`: `production`

### 5. Deploy Your Site

1. Click "Deploy site"
2. Wait for the build and deployment to complete
3. Once deployed, Netlify will provide you with a URL for your site

### 6. Verify Deployment

1. Visit your Netlify site URL
2. Test the login functionality
3. Verify that you can access and manage your inventory

### 7. Set Up Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to set up your custom domain

## Troubleshooting

### 404 Errors
If you encounter 404 errors, check:
- Your redirects in netlify.toml
- The environment variables are correctly set
- The API URL is correctly configured

### API Connection Issues
If your frontend can't connect to the backend:
- Check the Network tab in browser DevTools
- Verify the NEXT_PUBLIC_API_URL is correctly set
- Check for CORS errors

### Database Connection Issues
If your backend can't connect to MongoDB:
- Verify the MONGODB_URI is correctly set
- Ensure your MongoDB Atlas IP whitelist includes Netlify's IPs or is set to allow all (0.0.0.0/0)

## Important Notes

1. Your backend is deployed as a serverless function with the path `/.netlify/functions/server`
2. All API routes are prefixed with `/.netlify/functions/server/api`
3. Environment variables must be set in the Netlify UI, not in files
4. MongoDB connection string contains sensitive information - consider changing the password after deployment

## Next Steps

1. Set up continuous deployment
2. Configure custom domain and HTTPS
3. Set up monitoring and alerts
4. Implement proper security practices for production
