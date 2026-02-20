# TaskFlow Backend

A robust Express.js backend API for task and project management application.

## Features

- **User Authentication**: JWT-based authentication with OTP verification
- **Project Management**: Create, read, update, and delete projects
- **Task Management**: Full CRUD operations for tasks within projects
- **Role-based Access**: Middleware for role verification
- **API Documentation**: Swagger UI for API testing and documentation
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Protection against API abuse
- **Security**: Helmet for HTTP security headers
- **Error Handling**: Centralized error handling middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **API Docs**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Security**: Helmet, CORS, express-rate-limit
- **Utilities**: bcryptjs, jsonwebtoken, nodemailer, dotenv

## Project Structure

```
Backend/
├── src/
│   ├── app.js              # Express app configuration
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   │   └── swagger.js     # Swagger configuration
│   ├── controllers/       # Route handlers
│   │   ├── auth.controller.js
│   │   ├── project.controller.js
│   │   └── task.controller.js
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── role.middleware.js
│   │   └── validation.middleware.js
│   ├── models/            # Mongoose models
│   │   ├── otp.model.js
│   │   ├── project.model.js
│   │   ├── task.model.js
│   │   └── user.model.js
│   ├── routes/            # API routes
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   └── test.routes.js
│   ├── services/          # Business logic
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── project.service.js
│   │   └── task.service.js
│   └── utils/             # Utility functions
│       ├── appError.js
│       ├── auth.validation.js
│       ├── generateOtp.js
│       ├── project.validation.js
│       └── task.validation.js
├── server.js              # Entry point
├── package.json
└── .env                   # Environment variables
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Navigate to the backend directory:
   
```
bash
   cd Backend
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Create a `.env` file in the root directory:
   
```
env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FRONTEND_URL=http://localhost:5173
   
```

4. Start the development server:
   
```
bash
   npm run dev
   
```

5. Access the API documentation:
   - Swagger UI: `http://localhost:5000/api-docs`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/verify-otp` | Verify OTP for registration |
| POST | `/api/auth/resend-otp` | Resend OTP |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:id` | Get task by ID |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/taskflow |
| JWT_SECRET | Secret key for JWT | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| SMTP_HOST | SMTP server host | smtp.gmail.com |
| SMTP_PORT | SMTP server port | 587 |
| SMTP_USER | SMTP username | - |
| SMTP_PASS | SMTP password | - |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests


