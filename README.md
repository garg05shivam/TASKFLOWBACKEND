# TaskFlow Backend

Backend API for TaskFlow with role-based access (`user`, `admin`, `super_admin`), collaboration, reminders, notifications, analytics, and super admin governance.

## Overview
| Item | Details |
|---|---|
| Project Type | REST API (Node.js + Express) |
| Authentication | JWT + OTP email verification |
| Database | MongoDB (Mongoose) |
| Primary Goal | Team task/project management with role-scoped access |
| API Docs | Swagger at `/api-docs` |

## Feature Matrix
| Module | What It Covers |
|---|---|
| Authentication | Register, login, OTP verify/resend, protected routes |
| Roles & Access | `user`, `admin`, `super_admin` authorization model |
| Projects | Create/update/delete projects, list accessible projects |
| Tasks | CRUD, assignee, status, priority, labels, completion flow |
| Collaboration | Project invites, team chat, task comments, activity log |
| Notifications | In-app notifications, mark as read, clear all |
| Reminders | Due-date/overdue reminders (email + in-app) |
| Analytics | Dashboard metrics + chart-ready data endpoints |
| Super Admin | Promote/demote, activate/deactivate, remove user/admin, global overview |

## Role Permissions
| Capability | User | Admin | Super Admin |
|---|:---:|:---:|:---:|
| Register/Login | Yes | Yes | Yes |
| Create Project | No | Yes (own scope) | Yes |
| Create/Update/Delete Task | No | Yes (own scope) | Yes |
| Invite Members | No | Yes (project owner/admin scope) | Yes |
| Task Comments / Project Chat | Yes | Yes | Yes |
| View Own Notifications | Yes | Yes | Yes |
| User Management (global) | No | No | Yes |
| Promote/Demote | No | No | Yes |
| Activate/Deactivate User | No | No | Yes |

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| DB | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Email | nodemailer |
| Security | helmet, cors, express-rate-limit |
| API Docs | swagger-jsdoc, swagger-ui-express |

## Directory Structure
```text
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
| Base Path | Purpose |
|---|---|
| `/api/auth` | Auth + OTP |
| `/api/projects` | Project management |
| `/api/tasks` | Task management + analytics |
| `/api/collaboration` | Invites, comments, chat, notifications |
| `/api/admin` | Super admin controls |
| `/api-docs` | Swagger UI |

## Important Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user/admin |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| POST | `/api/auth/verify-otp` | Public | Verify OTP |
| POST | `/api/auth/resend-otp` | Public | Resend OTP |
| GET | `/api/projects` | Auth | List projects in user scope |
| POST | `/api/projects` | Admin/Super Admin | Create project |
| GET | `/api/tasks` | Auth | List tasks (with filters) |
| GET | `/api/tasks/analytics` | Auth | Role-scoped analytics |
| POST | `/api/tasks/:id/complete` | Assigned user | Mark task complete flow |
| GET | `/api/collaboration/notifications` | Auth | Fetch notifications |
| PATCH | `/api/collaboration/notifications/:id/read` | Auth | Mark notification read |
| DELETE | `/api/collaboration/notifications` | Auth | Clear all own notifications |
| GET | `/api/admin/overview` | Super Admin | Global overview data |
| PATCH | `/api/admin/users/:id/role` | Super Admin | Promote/Demote user |
| PATCH | `/api/admin/users/:id/status` | Super Admin | Activate/Deactivate user |
| DELETE | `/api/admin/users/:id` | Super Admin | Remove user/admin |

## Environment Variables
| Variable | Required | Example | Notes |
|---|---|---|---|
| `PORT` | No | `5000` | Backend server port |
| `MONGODB_URI` | Yes | `mongodb+srv://...` | Mongo connection string |
| `JWT_SECRET` | Yes | `your_jwt_secret` | Token signing key |
| `JWT_EXPIRE` | Yes | `7d` | Token expiration |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Primary frontend URL |
| `CLIENT_URL_2` | No | `https://your-other-url` | Optional second frontend URL |
| `EMAIL_USER` | Yes | `your_email@gmail.com` | SMTP user |
| `EMAIL_PASS` | Yes | `app_password` | SMTP password/app password |
| `EMAIL_FROM` | No | `your_email@gmail.com` | Sender address |
| `ENABLE_TASK_REMINDERS` | No | `true` | Enable reminder worker |
| `NODE_ENV` | No | `development` | Runtime environment |

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Create `.env` in `Backend/` using the variables above.

3. Start server:
```bash
npm run dev
```

4. Open Swagger docs:
- `http://localhost:5000/api-docs`

## Super Admin Setup (Manual)
Public registration supports `user` and `admin`. To make an account `super_admin`, update an existing user:

```js
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "super_admin", isVerified: true, isActive: true } }
)
```

## Safety Rules Implemented
- Deactivated users cannot log in.
- Super admin cannot deactivate/remove own account.
- Super admin cannot remove another super admin.
- Admin/project-owner deletion is blocked until ownership constraints are resolved.

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start backend with nodemon |
| `npm start` | Start backend in production mode |

## Quick End-to-End Test
1. Register -> verify OTP -> login.
2. Admin creates project and tasks.
3. Admin invites member; member accepts invite.
4. Admin assigns task; member receives notification.
5. Member completes task; admin receives completion notification.
6. Super admin validates promote/demote, activate/deactivate, remove flows.
