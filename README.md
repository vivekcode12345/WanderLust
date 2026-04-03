# WanderLust

WanderLust is a full-stack travel accommodation listing platform built with Node.js, Express, MongoDB, and EJS. It lets users browse stays, search and filter listings, view listing details on a map, create bookings, manage favorites, and leave reviews. Admin users can create, edit, and delete listings, while regular users can browse and book available stays.

### Uploaded Screenshots

![WanderLust screenshot 1](screenshots/Screenshot%202026-04-03%20at%203.09.25%E2%80%AFPM.png)

![WanderLust screenshot 2](screenshots/Screenshot%202026-04-03%20at%203.11.13%E2%80%AFPM.png)

Recommended future images:

- Homepage and listing cards
- Listing details page
- Booking form
- My Bookings page
- Manage Bookings page

## Live Demo

- Deployed App: https://wanderlust-project-2z5k.onrender.com

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

- **Frontend:** EJS, HTML, CSS, Bootstrap, vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js, Passport Local Mongoose
- **File Uploads:** Multer, Cloudinary
- **Maps:** Mapbox
- **AI Integration:** Groq SDK
- **Email:** Nodemailer
- **Security:** Helmet, express-rate-limit, connect-mongo

## Project Structure

```text
backend/
  app.js
  controllers/
  models/
  routes/
  init/
  middleware.js
  schema.js
  utils/
frontend/
  views/
  public/
screenshots/
live-demo/
package.json
.env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as reference.

Required variables:

```env
ATLASDB_URL=
SECRET=
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
MAP_TOKEN=
GROQ_API_KEY=
EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASS=
APP_URL=http://localhost:8080
PORT=8080
```

### 3. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 4. Open the App

Visit:

```text
http://127.0.0.1:8080
```

## Main User Flows

### Guest / Normal User

- Sign up and log in
- Browse all listings
- Use search, filters, and sorting
- Open listing details
- Create booking requests
- View own bookings
- Save favorites
- Write reviews

### Admin

- Add new listings
- Edit or delete listings
- Generate listing descriptions with AI
- Review and manage bookings
- Confirm or cancel booking requests

## API / Route Highlights

- `/listings` - browse listings
- `/listings/:id` - listing details
- `/listings/:id/book` - booking form and booking creation
- `/bookings/me` - user bookings
- `/bookings/manage` - admin/host booking management
- `/signup`, `/login`, `/logout` - auth routes
- `/favorites` - saved listings
- `/health` - service health check

## Functional Notes

- Uploaded listing images are stored in Cloudinary.
- If an image URL fails, the UI falls back to a local placeholder.
- Booking date overlap is prevented.
- Global rate limiting is enabled to protect the app from abuse.
- Admin-only actions are protected server-side.

## Testing

Run the test suite with:

```bash
npm test
```
## License

This project is for educational and portfolio use.
