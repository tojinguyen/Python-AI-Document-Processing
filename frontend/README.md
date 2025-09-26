# Frontend Dependencies Installation Guide

## Install Node.js and npm
Make sure you have Node.js (version 16 or higher) installed on your system.

## Install Dependencies
Navigate to the frontend directory and run:

```bash
cd frontend
npm install
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build

## Development Server
To start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Backend Setup
Make sure your Django backend is running on http://localhost:8000 before using the frontend.

## Features Included
- User Registration with validation
- User Login with JWT authentication  
- Protected Dashboard page
- Automatic token refresh
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
- Form validation with React Hook Form