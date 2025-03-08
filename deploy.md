# Deployment Guide for Inventory Management System

## Part 1: Pushing to GitHub

### One-time setup

1. Initialize Git repository (if not already done)
```bash
git init
```

2. Add your GitHub repository as remote
```bash
git remote add origin https://github.com/hadesxkore/InventorySystem.git
```

### Pushing changes

1. Add all files to staging
```bash
git add .
```

2. Commit changes
```bash
git commit -m "Initial commit"
```

3. Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## Part 2: Setting up Environment Variables for Production

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Frontend Environment Variables

Create a `.env.production` file in the frontend directory with:
```
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

## Part 3: Deploying to Vercel

1. Sign up/login to [Vercel](https://vercel.com)
2. Create a new project and import your GitHub repository
3. Configure the project:
   - Framework preset: Next.js
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `.next`
4. Add the environment variables in Vercel project settings
5. Deploy

## Part 4: Deploying Backend to Railway or Render

### Railway
1. Sign up/login to [Railway](https://railway.app)
2. Create a new project and select "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - Root directory: `backend`
   - Start command: `npm start`
5. Add environment variables
6. Deploy

### Render
1. Sign up/login to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - Name: `inventory-system-api`
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
5. Add environment variables
6. Deploy

## Part 5: Update Frontend API URL

After deploying your backend, get the URL of your deployed API and update:
1. The `NEXT_PUBLIC_API_URL` in your Vercel environment variables
2. Redeploy your frontend if necessary

## Part 6: MongoDB Access

Your application will continue to access MongoDB through the connection string:
1. Ensure your MongoDB Atlas cluster has network access set to allow connections from anywhere (0.0.0.0/0) or specifically from your backend service's IP
2. You can continue to use MongoDB Compass locally with the same connection string

## Part 7: Firebase Authentication Setup

1. Go to your Firebase project console
2. Navigate to Authentication > Settings > Authorized domains
3. Add your deployed frontend domain (e.g., `inventory-system-xyz.vercel.app`)
4. Save changes

## Troubleshooting

### CORS Issues
If you encounter CORS issues after deployment, ensure your backend CORS configuration includes your frontend domain:

```javascript
// In backend/index.js
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
  credentials: true
}));
```

### Environment Variables
Double-check that all environment variables are correctly set in your deployment platforms.

### MongoDB Connection
If you can't connect to MongoDB, ensure:
1. The connection string is correct
2. Network access is properly configured
3. Your MongoDB Atlas account is active

### Firebase Authentication
If authentication is not working:
1. Verify your Firebase API keys and configuration
2. Check that your app's domain is authorized in Firebase console 