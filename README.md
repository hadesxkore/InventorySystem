# Inventory Management System

A full-stack inventory management system built with Next.js, Node.js, Express, MongoDB, and Firebase Authentication.

## Features

- **User Authentication**: Secure login and registration system using Firebase
- **Inventory Management**: Add, edit, and delete products with details
- **Transaction History**: Track all inventory movements (stock in, stock out, adjustments)
- **Reports**: Generate inventory reports, export to PDF and Excel
- **Dashboard**: Visual overview of inventory status and key metrics
- **Low Stock Alerts**: Automatic notifications for products below threshold
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Tech Stack

### Frontend
- Next.js 14 (React framework)
- TypeScript
- TailwindCSS & ShadCN UI
- React Context API for state management
- jsPDF & SheetJS for exports

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Firebase Authentication
- JWT for API authentication

## Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- MongoDB (local or Atlas)
- Firebase project with Authentication enabled

### Environment Variables

#### Backend (.env file in backend directory)
```
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
```

#### Frontend (.env.local file in frontend directory)
```
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/hadesxkore/InventorySystem.git
cd InventorySystem
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Start the backend server
```bash
cd ../backend
npm run dev
```

5. Start the frontend development server
```bash
cd ../frontend
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Deployment Guide

### Deploying to Vercel

1. Push your repository to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Configure the project:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/.next`
   - Root Directory: `/`
5. Add the environment variables in Vercel project settings
6. Deploy

### Deploying the Backend

Options for backend deployment:
- Railway
- Render
- Heroku
- AWS

Make sure to update the `NEXT_PUBLIC_API_URL` in your frontend environment variables to point to your deployed backend URL.

## Using MongoDB After Deployment

After deploying your application:

1. Your MongoDB connection will still work as it's linked through the connection string
2. You can continue to use MongoDB Compass to connect to your database using the same connection string
3. Make sure your MongoDB Atlas cluster has network access configured to allow connections from your deployed backend

## Using Firebase After Deployment

Firebase authentication will continue to work after deployment with the same configuration, just make sure:

1. Your Firebase project settings allow your deployed domain in the "Authorized domains" section
2. You've properly set up all Firebase environment variables in your deployment platform

## License

MIT

## Author

[Your Name]

## Acknowledgements

- ShadCN UI for the component library
- Vercel for hosting 