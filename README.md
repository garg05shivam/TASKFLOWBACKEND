# TaskFlow Backend

Backend API for TaskFlow with role-based access (`user`, `admin`, `super_admin`), collaboration, notifications, reminders, and analytics.

## Core Features
- Authentication: register, login, OTP verify/resend, JWT auth
- Roles:
  - `user`: assigned tasks and collaboration access
  - `admin`: manages own projects/tasks/team
  - `super_admin`: global overview + user management
- Projects: create/update/delete, members, invitations
- Tasks: create/update/delete, assign, status, priority, labels
- Collaboration: task comments, project chat, activity log
- Notifications: in-app notifications, mark-read, clear-all
- Reminder worker: due/overdue reminders (in-app + email)
- Analytics: role-scoped dashboard analytics and chart-ready datasets
- Super admin controls:
  - global overview
  - promote/demote (`user` <-> `admin`)
  - activate/deactivate users
  - remove user/admin (with safeguards)

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- express-validator
- nodemailer
- Helmet, CORS, express-rate-limit

## Folder Structure
```
Backend/
  src/
    app.js
    config/
    controllers/
    middlewares/
    models/
    routes/
    services/
    utils/
  server.js
  package.json
```

## API Modules
- `/api/auth`
- `/api/projects`
- `/api/tasks`
- `/api/collaboration`
- `/api/admin` (super_admin only)
- `/api-docs` (Swagger)

## Setup
1. Install:
```bash
npm install
```

2. Create `.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRE=7d

CLIENT_URL=http://localhost:5173
CLIENT_URL_2=

EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_app_password
EMAIL_FROM=your_smtp_email

ENABLE_TASK_REMINDERS=true
```

3. Run:
```bash
npm run dev
```

## Notes
- Public signup supports only `user`/`admin`.
- Create `super_admin` manually in DB by updating an existing user role.
- Deactivated users cannot log in or access protected routes.

## Scripts
- `npm run dev`
- `npm start`
