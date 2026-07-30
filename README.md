# WanderLust 2.0

Modern full-stack travel accommodation platform with a Next.js 14 frontend and Express.js backend.

### Uploaded Screenshots

![WanderLust screenshot 1](screenshots/Screenshot%202026-04-03%20at%203.09.25%E2%80%AFPM.png)

![WanderLust screenshot 2](screenshots/Screenshot%202026-04-03%20at%203.11.13%E2%80%AFPM.png)

## Live Demo

- Deployed App: https://wanderlust-project-2z5k.onrender.com

## Overview

WanderLust is a full-stack travel accommodation listing platform that lets users browse stays, search and filter listings, view listing details on a map, create bookings, manage favorites, and leave reviews. Admin users can create, edit, and delete listings, while regular users can browse and book available stays.

The platform features a modern Next.js 14 frontend with TypeScript and Tailwind CSS, powered by a robust Express.js and MongoDB backend.

## Live Features

- Authentication with signup, login, logout, and password reset
- Role-based access control for admin and guest users
- Listing browsing with search, category filters, price filters, and sorting
- Booking flow with booking requests, booking history, and booking management
- Favorites system for saved places
- Reviews and ratings on listings
- Cloudinary image uploads with safe fallback handling
- Mapbox map integration for location display
- Groq AI-powered listing description generation
- Security hardening with Helmet, rate limiting, sessions, and flash messages

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Maps**: Mapbox GL

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js
- **File Uploads**: Multer + Cloudinary
- **Email**: Nodemailer
- **AI**: Groq SDK
- **Security**: Helmet, express-rate-limit, express-session

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Backend server running on port 8080

### Frontend Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your configuration

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

The Express.js backend is located in the `backend/` directory. Ensure it's running on port 8080 for the frontend to communicate with it.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript compiler
- `npm test` - Run tests

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # App constants
│   ├── providers/       # Context providers
│   └── styles/          # Global styles
├── backend/             # Express.js API server
│   ├── controllers/     # Route controllers
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── middleware.js    # Express middleware
│   └── app.js          # Express app entry
└── screenshots/        # Project screenshots
```

## Features

- Browse listings with search and filters
- View listing details with map integration
- Book accommodations with date selection
- Manage bookings (guest and host)
- Write and manage reviews
- Save favorite listings
- User dashboard with statistics
- Admin listing management
- Password reset flow
- Responsive design
- Dark mode support

## Development

This project follows modern web development best practices:

### Frontend
- Server Components by default
- Client Components for interactivity
- Type-safe with TypeScript
- Utility-first CSS with Tailwind
- Component-driven development

### Backend
- MVC architecture
- RESTful API design
- MongoDB with strategic indexing
- Passport.js authentication
- Input validation with Joi
- Security best practices (Helmet, rate limiting)

## API Routes

- `/listings` - Browse listings
- `/listings/:id` - Listing details
- `/listings/:id/book` - Booking form and creation
- `/bookings/me` - User bookings
- `/bookings/manage` - Admin/host booking management
- `/signup`, `/login`, `/logout` - Authentication
- `/favorites` - Saved listings
- `/health` - Service health check

## Testing

Run the test suite with:

```bash
npm test
```

## Deployment

### Frontend
Deployed on Vercel with automatic CI/CD.

### Backend
Deployed on Render with MongoDB Atlas.

## License

MIT