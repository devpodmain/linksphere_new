# Linksphere

A web application that allows users and organizations to create public digital profiles with links, bios, collaborations, analytics, QR codes, subscriptions, and bookings.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Backend:** PHP (MVC structure) running on XAMPP
- **Database:** MySQL
- **Auth:** JWT (access + refresh tokens stored in HttpOnly cookies)

## Project Structure

```
linksphere/
├── frontend/          # React + TypeScript + Vite + TailwindCSS
├── backend/           # PHP MVC backend
├── database/          # MySQL schema and migrations
└── README.md
```

## Setup Instructions

### Prerequisites
- XAMPP installed and running
- Node.js and npm
- Composer (for PHP dependencies)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up the database:
   - Import the SQL file from `database/schema.sql` into your MySQL database
   - Update database credentials in `backend/config/database.php`

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- Frontend on `http://localhost:5173`
- Backend API on `http://localhost:8000`

## Features

- **Landing Page** (public, responsive)
- **Auth System** (Signup, Login, JWT handling)
- **Dashboard** with Navbar: Home, Profile, Account, Booking, Support
- **Profile Module** (Image upload, Basic Info, Links, Collaborations, QR code, Mobile Preview)
- **Account Settings** (personal info, subscription, delete account)
- **Support Section** (FAQ, contact form)

## Development

- Frontend development: `npm run dev:frontend`
- Backend development: `npm run dev:backend`
- Build for production: `npm run build`


