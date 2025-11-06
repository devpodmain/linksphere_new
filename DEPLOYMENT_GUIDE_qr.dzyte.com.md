# 🚀 Deployment Guide for qr.dzyte.com

## 📋 Pre-Deployment Checklist

### ✅ Configuration Updates Completed:
- [x] Frontend API URL updated to `https://qr.dzyte.com/backend`
- [x] Backend CORS settings updated to allow `https://qr.dzyte.com`
- [x] Upload paths fixed for production environment
- [x] .htaccess files updated for production structure
- [x] Production environment template created

---

## 🏗️ Step-by-Step Deployment Process

### **Step 1: Prepare Your Local Project**

#### 1.1 Build Frontend for Production
```bash
cd frontend
npm run build
```
This creates optimized files in `frontend/dist/` directory.

#### 1.2 Verify Configuration
Ensure all files have been updated with your domain:
- ✅ `frontend/src/config/api.ts` → `https://qr.dzyte.com/backend`
- ✅ `backend/index.php` → CORS allows `https://qr.dzyte.com`
- ✅ `backend/public/index.php` → CORS allows `https://qr.dzyte.com`

---

### **Step 2: Hostinger Setup**

#### 2.1 Access Hostinger Control Panel
1. Log into your Hostinger account
2. Go to your hosting control panel
3. Access File Manager

#### 2.2 Prepare public_html Directory
1. Navigate to `public_html` directory
2. Delete default files (index.html, etc.)
3. Clear any existing content

---

### **Step 3: Upload Project Files**

#### 3.1 File Structure on Hostinger
Your final structure should be:
```
public_html/00webapp/qr/
├── backend/
│   ├── api/
│   ├── src/
│   ├── routes/
│   ├── uploads/
│   │   ├── profiles/
│   │   └── collaborations/
│   ├── public/
│   │   └── uploads/
│   │       ├── profiles/
│   │       └── collaborations/
│   ├── vendor/
│   ├── .env (create this)
│   ├── .htaccess
│   ├── index.php
│   └── composer.json
├── frontend/
│   └── dist/
│       ├── assets/
│       ├── index.html
│       └── vite.svg
└── .htaccess (copy from .htaccess.production)
```

#### 3.2 Upload Commands
```bash
# Upload backend files
scp -r backend/ your_username@qr.dzyte.com:/public_html/00webapp/qr/

# Upload frontend build
scp -r frontend/dist/ your_username@qr.dzyte.com:/public_html/00webapp/qr/frontend/

# Upload root .htaccess
scp .htaccess.production your_username@qr.dzyte.com:/public_html/00webapp/qr/.htaccess
```

---

### **Step 4: Database Setup**

#### 4.1 Create Database in Hostinger
1. Go to **MySQL Databases** in Hostinger control panel
2. Create database: `qr_dzyte_linksphere`
3. Create user: `qr_dzyte_dbuser`
4. Set a strong password
5. Assign user to database with all privileges

#### 4.2 Import Database Schema
1. Go to **phpMyAdmin**
2. Select your database `qr_dzyte_linksphere`
3. Import `database/schema.sql`

---

### **Step 5: Environment Configuration**

#### 5.1 Create Production .env File
Create `backend/.env` with these values:
```env
DB_HOST=localhost
DB_NAME=qr_dzyte_linksphere
DB_USER=qr_dzyte_dbuser
DB_PASS=YOUR_SECURE_DATABASE_PASSWORD
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_KEY_HERE_MAKE_IT_LONG_AND_RANDOM
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRY=3600
JWT_REFRESH_EXPIRY=604800
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
APP_ENV=production
APP_URL=https://qr.dzyte.com
API_URL=https://qr.dzyte.com/backend
```

#### 5.2 Set File Permissions
```bash
# Set upload directories permissions
chmod 755 public_html/00webapp/qr/backend/uploads/
chmod 755 public_html/00webapp/qr/backend/uploads/profiles/
chmod 755 public_html/00webapp/qr/backend/uploads/collaborations/
chmod 755 public_html/00webapp/qr/backend/public/uploads/
chmod 755 public_html/00webapp/qr/backend/public/uploads/profiles/
chmod 755 public_html/00webapp/qr/backend/public/uploads/collaborations/

# Set .env file permissions
chmod 600 public_html/00webapp/qr/backend/.env
```

---

### **Step 6: Install Dependencies**

#### 6.1 Backend Dependencies
If Hostinger supports Composer:
```bash
cd backend
composer install --no-dev --optimize-autoloader
```

If not, upload the `vendor` folder from your local development.

---

### **Step 7: SSL Certificate**

#### 7.1 Enable SSL
1. In Hostinger control panel, go to **SSL**
2. Enable **Free SSL Certificate** for `qr.dzyte.com`
3. Force HTTPS redirect (already configured in .htaccess)

---

### **Step 8: Test Your Deployment**

#### 8.1 Test API Endpoints
```bash
# Test API root
curl https://qr.dzyte.com/00webapp/qr/backend/

# Expected response:
{
  "success": true,
  "message": "LinkSphere API is running!",
  "version": "1.0.0",
  "endpoints": {...}
}
```

#### 8.2 Test Frontend
1. Visit `https://qr.dzyte.com/00webapp/qr/`
2. Verify the page loads correctly
3. Test user registration
4. Test login functionality
5. Test profile image upload
6. Test all major features

#### 8.3 Test File Uploads
1. Register a new user
2. Try uploading a profile image
3. Verify image appears correctly at: `https://qr.dzyte.com/00webapp/qr/backend/public/uploads/profiles/`
4. Check file permissions

---

### **Step 9: Production Optimizations**

#### 9.1 Enable Compression (Already in .htaccess)
- Gzip compression enabled
- Browser caching configured
- Security headers set

#### 9.2 Monitor Performance
- Check loading times
- Monitor error logs
- Test on mobile devices

---

## 🔧 Configuration Files Summary

### Files Updated for Production:

1. **`frontend/src/config/api.ts`**
   - API URL: `https://qr.dzyte.com/backend`

2. **`backend/index.php`**
   - CORS origin: `https://qr.dzyte.com`

3. **`backend/public/index.php`**
   - CORS origin: `https://qr.dzyte.com`

4. **`backend/api/upload-profile-image-simple.php`**
   - Upload path: `/backend/public/uploads/profiles/`

5. **`.htaccess.production`**
   - Root .htaccess for production deployment

6. **`backend/.htaccess`**
   - Updated for production routing

---

## 🚨 Important Security Notes

### Before Going Live:
- [ ] Generate strong database password (20+ characters)
- [ ] Generate strong JWT secret (50+ characters)
- [ ] Test all functionality thoroughly
- [ ] Verify SSL certificate is working
- [ ] Check file permissions are correct
- [ ] Monitor error logs

### Security Checklist:
- [x] HTTPS enforced
- [x] CORS properly configured
- [x] File upload restrictions
- [x] Security headers set
- [x] Sensitive files protected
- [x] SQL injection protection
- [x] XSS protection

---

## 🐛 Troubleshooting

### Common Issues:

#### 1. CORS Errors
- Verify domain in CORS settings
- Check HTTPS vs HTTP mismatch

#### 2. File Upload Issues
- Check directory permissions (755)
- Verify upload path configuration
- Check PHP upload limits

#### 3. Database Connection Issues
- Verify database credentials
- Check database name and user
- Ensure database exists

#### 4. 404 Errors
- Check .htaccess configuration
- Verify file structure
- Check Apache mod_rewrite

### Debug Commands:
```bash
# Check PHP errors
tail -f /path/to/error.log

# Check Apache logs
tail -f /var/log/apache2/error.log

# Test database connection
php -r "new PDO('mysql:host=localhost;dbname=qr_dzyte_linksphere', 'qr_dzyte_dbuser', 'password');"
```

---

## 📞 Support

If you encounter issues:
1. Check Hostinger error logs
2. Verify all configuration files
3. Test each component individually
4. Check file permissions
5. Monitor browser console for errors

---

## 🎉 Post-Deployment

### After Successful Deployment:
1. **Test all features thoroughly**
2. **Monitor performance and errors**
3. **Set up regular backups**
4. **Keep dependencies updated**
5. **Monitor security logs**

### Regular Maintenance:
- Update dependencies monthly
- Monitor error logs weekly
- Backup database daily
- Review security settings quarterly

---

**Your LinkSphere application is now ready for production deployment on qr.dzyte.com!** 🚀
