# Linksphere Setup Guide

## Prerequisites

- XAMPP installed and running
- Node.js and npm
- Composer (for PHP dependencies)

## Installation Steps

### 1. Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database called `linksphere`
4. Import the database schema:
   - Go to the `linksphere` database
   - Click "Import" tab
   - Choose the file `database/schema.sql`
   - Click "Go" to import

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Create environment file:
   ```bash
   copy env.example .env
   ```

4. Update the `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_NAME=linksphere
   DB_USER=root
   DB_PASS=
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   ```

5. Start the backend server:
   ```bash
   php -S localhost:8000 -t public
   ```

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Public Profile: http://localhost:5173/profile/{profile-url}

## Features

✅ **Landing Page** - Responsive design with hero section, features, and CTA
✅ **Authentication** - Signup/Login with JWT tokens stored in HttpOnly cookies
✅ **Dashboard** - Home, Profile, Account, and Support sections
✅ **Profile Management** - Image upload, basic info, links, collaborations
✅ **QR Code Generation** - Auto-generated QR codes for profile sharing
✅ **Mobile Preview** - Real-time preview of your profile
✅ **Account Settings** - Personal info, subscription management, account deletion
✅ **Support System** - FAQ, contact form, and ticket management
✅ **Public Profiles** - Beautiful mobile-first profile pages

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Profile Management
- `GET /api/profiles/me` - Get current user's profile
- `PUT /api/profiles/me` - Update current user's profile
- `GET /api/profiles/{profile_url}` - Get public profile

### Account Management
- `GET /api/account` - Get account information
- `PUT /api/account` - Update account information
- `DELETE /api/account` - Delete account

### Support
- `GET /api/support/faq` - Get FAQ
- `POST /api/support/ticket` - Create support ticket
- `GET /api/support/tickets` - Get user's support tickets

### File Upload
- `POST /api/upload/profile-image` - Upload profile image
- `POST /api/upload/collaboration-logo` - Upload collaboration logo

## Database Schema

The application uses the following main tables:
- `users` - User accounts and authentication
- `user_profiles` - Profile information and settings
- `social_links` - Social media links
- `custom_links` - Custom links with labels
- `collaborations` - Partnership and collaboration information
- `support_tickets` - Support ticket system

## Security Features

- JWT-based authentication with access and refresh tokens
- HttpOnly cookies for token storage
- Password hashing with PHP's password_hash()
- Input validation and sanitization
- CORS protection
- File upload validation

## Development

- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: PHP 8+ with MVC architecture
- Database: MySQL
- Authentication: JWT with Firebase JWT library

## Troubleshooting

1. **Database Connection Issues**: Check XAMPP MySQL is running and credentials in `.env`
2. **CORS Issues**: Ensure backend is running on port 8000
3. **File Upload Issues**: Check upload directory permissions
4. **JWT Issues**: Verify JWT_SECRET is set in `.env`

## Production Deployment

1. Update `.env` with production database credentials
2. Set secure JWT secret
3. Enable HTTPS
4. Set secure cookie flags
5. Configure proper file upload limits
6. Set up proper error logging


