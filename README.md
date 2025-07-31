# 🚗 Golf Car Maintenance System

A comprehensive maintenance management system for golf car fleets, built with Next.js, MongoDB, and Prisma. This system provides complete fleet management capabilities including maintenance tracking, job assignments, parts management, and user role-based access control.

## ✨ Features

- 🔧 **Maintenance Management** - Track and schedule maintenance jobs
- 👥 **User Role Management** - Admin, Supervisor, and Technician roles
- 🏌️ **Golf Course Management** - Multi-location support
- 📦 **Parts Inventory** - Track parts usage and inventory
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Secure Authentication** - Role-based access control
- 📊 **Performance Monitoring** - Built-in performance tracking
- 📸 **Image Upload** - Maintenance documentation with photos

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and MongoDB

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd golfcar-maintenance
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Initialize database:**
   ```bash
   npm run db:push
   npm run migrate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - Database Studio: `npm run db:studio`

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) folder:

- **[📖 Documentation Index](./docs/README.md)** - Complete documentation overview
- **[🚀 Production Setup](./docs/PRODUCTION_SETUP_GUIDE.md)** - Deployment guide
- **[🔒 Security Guidelines](./docs/SECURITY.md)** - Security best practices
- **[📋 API Documentation](./docs/API_DOCUMENTATION.md)** - API reference
- **[🔧 Frontend Guide](./docs/FRONTEND_INTEGRATION_GUIDE.md)** - Development guide
- **[🗄️ Database Guide](./docs/DATABASE_OPTIMIZATION.md)** - Database optimization
- **[🧪 Testing Guide](./docs/PRISMA_TEST_GUIDE.md)** - Testing procedures

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory (App Router)
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── maintenance/   # Maintenance job APIs
│   │   ├── users/         # User management APIs
│   │   ├── vehicles/      # Vehicle management APIs
│   │   ├── parts/         # Parts inventory APIs
│   │   └── golf-courses/  # Golf course APIs
│   ├── add-maintenance/   # Maintenance form page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main dashboard
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── AdminDashboard.tsx # Admin interface
│   ├── LoginScreen.tsx    # Authentication
│   └── ...               # Other components
├── docs/                  # 📚 Complete documentation
├── lib/                   # Utilities and configurations
│   ├── db/               # Database connections
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions
│   └── validation/       # Input validation
├── models/               # Data models
├── prisma/               # Database schema and migrations
├── public/               # Static assets
│   └── uploads/          # File upload directory
├── scripts/              # Utility scripts
├── types/                # TypeScript type definitions
└── test-*.js            # Test files
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio
npm run migrate          # Run data migration

# Utilities
npm run reset-password   # Reset user password
```

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Database Configuration
DATABASE_URL="mongodb://localhost:27017/golfcarmaintenance_db"

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
UPLOAD_PATH=public/uploads

# API Configuration
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 👥 User Roles

- **Admin** - Full system access, user management, system configuration
- **Supervisor** - Job assignment, approval, reporting
- **Technician** - Job execution, maintenance logging

## 🚨 Security Notice

⚠️ **Important Security Guidelines:**
- Never commit `.env` files with real credentials
- Change default passwords before production
- Review [Security Guidelines](./docs/SECURITY.md) before deployment
- Use strong MongoDB credentials in production

## 🚀 Production Deployment

For production deployment, see:
- **[Production Setup Guide](./docs/PRODUCTION_SETUP_GUIDE.md)** - Complete deployment instructions
- **[Security Checklist](./docs/SECURITY.md)** - Pre-deployment security review

## 🧪 Testing

```bash
# Test API endpoints
node test-api-complete.js

# Test authentication
node test-login.js

# Test job creation
node test-job-creation.js

# Test supervisor permissions
node test-supervisor-permissions.js
```

## 📞 Support & Troubleshooting

For detailed setup instructions, troubleshooting, and development guides:
- 📖 [Complete Documentation](./docs/)
- 🔧 [Quick Update Commands](./docs/QUICK_UPDATE_COMMANDS.md)
- 🧹 [Clean Production Setup](./docs/CLEAN_PRODUCTION_SUMMARY.md)

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB with Prisma ORM
- **Authentication:** Custom JWT-based auth
- **File Upload:** Multer with Sharp image processing
- **Styling:** CSS Modules
- **Validation:** Zod schema validation

---

**Version:** 0.1.0 | **Built with:** Next.js, MongoDB, Prisma, TypeScript
