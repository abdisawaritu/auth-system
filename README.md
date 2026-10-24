# Authentication System

A full-stack authentication project built with **React (Vite), Node.js, Express.js, and MySQL**. The backend uses server-side sessions to manage authenticated users.

This project is being developed phase by phase to make the authentication process secure, understandable, testable, and maintainable.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Objectives](#project-objectives)
3. [Technology Stack](#technology-stack)
4. [Current Project Status](#current-project-status)
5. [Project Structure](#project-structure)
6. [System Architecture](#system-architecture)
7. [Prerequisites](#prerequisites)
8. [Setup Instructions](#setup-instructions)
9. [Environment Configuration](#environment-configuration)
10. [Database Setup](#database-setup)
11. [Backend API Reference](#backend-api-reference)
12. [Authentication Workflows](#authentication-workflows)
13. [Testing the Backend](#testing-the-backend)
14. [Security Considerations](#security-considerations)
15. [Team Collaboration with Git](#team-collaboration-with-git)
16. [Remaining Roadmap](#remaining-roadmap)

## Project Overview

The Authentication System provides the backend foundation for user registration, login, session-based authentication, protected routes, and logout.

The backend validates user input, hashes passwords before storing them, verifies login credentials, and stores session information in MySQL.

The React client will be connected to the backend after the remaining authentication features and backend tests have been completed.

## Project Objectives

- Register users with validated account information.
- Store password hashes instead of plain-text passwords.
- Authenticate users using their email and password.
- Maintain login state using server-side sessions.
- Protect endpoints that require authentication.
- Retrieve the currently authenticated user's information.
- Support logout and server-side session invalidation.
- Manage session expiration.
- Prepare for email verification and password recovery.
- Provide clear documentation for development and teamwork.

## Technology Stack

| Technology | Purpose |
|---|---|
| React and Vite | Frontend application and development server |
| Node.js | JavaScript runtime for the backend |
| Express.js | HTTP server, routes, and middleware |
| MySQL | Persistent user and session storage |
| mysql2 | MySQL database connection and queries |
| bcrypt | Password hashing and password verification |
| express-session | Session-based authentication |
| express-mysql-session | Stores sessions in MySQL |
| dotenv | Loads environment variables |
| cors | Controls cross-origin requests |
| nodemon | Restarts the backend during development |
| Git and GitHub | Version control and team collaboration |

## Current Project Status

### Completed: Phases 1–7

- **Phase 1 — Database design:** Created the `auth_system` database and the required tables.
- **Phase 2 — Backend initialization:** Initialized the Node.js project and configured Express.
- **Phase 3 — Database connection:** Connected Express to MySQL and tested database connectivity.
- **Phase 4 — User registration:** Validated registration data, checked duplicate emails, hashed passwords, and inserted new users.
- **Phase 5 — User login:** Verified credentials and created server-side sessions.
- **Phase 6 — Authentication middleware:** Protected endpoints and implemented the current-user endpoint.
- **Phase 7 — Logout and session management:** Implemented logout, session destruction, cookie clearing, and session expiration settings.

### Not yet implemented

Email verification and password recovery tables exist in the database, but their complete API workflows have not yet been implemented.

React integration is also pending.

## Project Structure

The repository is organized into a client and a server:

```text
auth-system/
├── client/                         # React frontend
│   └── ...
├── server/
│   ├── config/
│   │   └── db.js                   # MySQL connection pool
│   ├── controllers/
│   │   └── authController.js       # Authentication functions
│   ├── middleware/
│   │   └── authMiddleware.js       # Authentication guard
│   ├── routes/
│   │   └── authRoutes.js           # Authentication endpoints
│   ├── .env                        # Local secrets; never commit
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js                   # Express entry point
├── .gitignore
└── README.md
```

### Important backend files

- `server.js`: Configures Express, CORS, JSON parsing, sessions, health-check routes, and authentication routes.
- `config/db.js`: Creates and exports the MySQL connection pool.
- `controllers/authController.js`: Contains `registerUser()`, `loginUser()`, `getCurrentUser()`, and `logoutUser()`.
- `middleware/authMiddleware.js`: Contains `authenticateUser()`, which checks whether a valid logged-in user is available in the session.
- `routes/authRoutes.js`: Maps HTTP methods and URLs to the appropriate controllers and middleware.
- `server/.env`: Contains local configuration and secrets. Each developer creates their own copy.

## System Architecture

```text
React Client
     |
     | HTTP requests and session cookies
     v
Express Server (server.js)
     |
     | Middleware and route matching
     v
Authentication Routes
     |
     +---- authenticateUser()
     |
     v
Authentication Controllers
     |
     | SQL queries
     v
MySQL Connection Pool
     |
     +---- users
     +---- sessions
     +---- email_verification_tokens
     +---- password_reset_tokens
```

### How authentication works

1. A user submits registration information.
2. The backend validates the input and stores a bcrypt password hash.
3. During login, the backend retrieves the account and verifies the password.
4. On successful login, Express creates a new session and stores its data in MySQL.
5. The browser receives the `auth.sid` session cookie.
6. Subsequent requests send the cookie so the server can load the session.
7. Protected routes use `authenticateUser()` to reject requests without an authenticated session.
8. Logout destroys the server-side session and clears the browser cookie.

## Prerequisites

Install the following on your computer:

- Node.js and npm.
- Git.
- MySQL or a compatible local MySQL environment, such as MAMP.
- A code editor such as Visual Studio Code.
- An API testing tool such as Postman or Thunder Client.

You should also have access to this GitHub repository.

## Setup Instructions

### 1. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/YOUR-USERNAME/auth-system.git
cd auth-system
```

Replace `YOUR-USERNAME` with the GitHub account that owns the repository.

If the repository is private, you must first be granted access and authenticate with GitHub.

### 2. Install backend dependencies

```bash
cd server
npm install
```

This installs the packages listed in `server/package.json`.

### 3. Configure environment variables

Create a local file named `server/.env`.

Use the example in the next section and replace the example values with your own database credentials and a strong session secret.

### 4. Create the database

Create the `auth_system` database and its tables using the SQL provided in the Database Setup section.

If the database and tables already exist, verify that their names and column definitions match the application.

### 5. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend should start at:

```text
http://localhost:5000
```

### 6. Verify the server and database

Open these URLs in your browser or API testing tool:

- `GET http://localhost:5000/api/health`
- `GET http://localhost:5000/api/db-health`

The first checks whether the server responds. The second checks whether the server can execute a MySQL query.

## Environment Configuration

Create `server/.env` locally:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_local_mysql_user
DB_PASSWORD=your_local_mysql_password
DB_NAME=auth_system

NODE_ENV=development
SESSION_SECRET=replace_with_a_strong_random_secret
```

**Important:**

- Use port `3306` if that is your local MySQL port. If you use MAMP configured for port `8889`, use `8889` instead.
- Use your own MySQL username and password.
- Generate a strong, unique session secret for your local environment.
- Keep `.env` out of Git and never share real credentials in the repository.
- `CLIENT_URL` must match the origin used by the frontend during development.
- Do not commit actual passwords or session secrets.

## Database Setup

Create the database first:

```sql
CREATE DATABASE auth_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE auth_system;
```

Create the users table:

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

Create the sessions table used by `express-mysql-session`:

```sql
CREATE TABLE sessions (
    session_id VARCHAR(128)
        COLLATE utf8mb4_bin NOT NULL,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    PRIMARY KEY (session_id),
    INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB;
```

Create the email verification token table:

```sql
CREATE TABLE email_verification_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_verification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_email_verification_user (user_id),
    INDEX idx_email_verification_expiry (expires_at)
) ENGINE=InnoDB;
```

Create the password reset token table:

```sql
CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_password_reset_user (user_id),
    INDEX idx_password_reset_expiry (expires_at)
) ENGINE=InnoDB;
```

These statements are for a fresh database. Do not rerun the `CREATE TABLE` statements over existing tables without first checking the database. If you want to recreate an existing database, back up any data first.

## Backend API Reference

Base URL:

```text
http://localhost:5000
```

| Method | Endpoint | Purpose | Expected response |
|---|---|---|---|
| GET | `/` | Basic API status | 200 |
| GET | `/api/health` | Server health check | 200 |
| GET | `/api/db-health` | Database connectivity check | 200 when connected |
| POST | `/api/auth/register` | Register a user | 201 on success |
| POST | `/api/auth/login` | Authenticate a user | 200 on success |
| GET | `/api/auth/me` | Get current authenticated user | 200 or 401 |
| GET | `/api/auth/private` | Demonstrate protected access | 200 or 401 |
| POST | `/api/auth/logout` | Log out and destroy the session | 200 or 401 |

### Registration

Request:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "ExamplePassword123"
}
```

Expected success status: `201 Created`.

Possible errors:

- `400 Bad Request`: missing or invalid input.
- `409 Conflict`: email already registered.
- `500 Internal Server Error`: unexpected server error.

### Login

Request:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "test@example.com",
  "password": "ExamplePassword123"
}
```

On success, the API returns `200 OK`, public user information, and a session cookie named `auth.sid`.

Incorrect credentials return `401 Unauthorized`.

### Current user

```http
GET /api/auth/me
```

Send the session cookie obtained during login. A valid session returns the current user's public information. A missing or invalid session returns `401 Unauthorized`.

### Protected endpoint

```http
GET /api/auth/private
```

This endpoint demonstrates access control based on the authenticated session.

### Logout

```http
POST /api/auth/logout
```

Send the active session cookie. A successful logout destroys the server-side session and clears the browser cookie. A subsequent request to `/api/auth/me` should return `401 Unauthorized`.

## Authentication Workflows

### Registration workflow

1. `registerUser()` receives registration data.
2. The controller validates the name, email, and password.
3. The controller checks for an existing email.
4. `bcrypt.hash()` generates the password hash.
5. The controller inserts the user into the `users` table.
6. The API returns the new user's public information.

### Login workflow

1. `loginUser()` validates the submitted credentials.
2. The controller retrieves the user by email.
3. `bcrypt.compare()` verifies the submitted password.
4. `req.session.regenerate()` creates a fresh session ID.
5. The controller stores the user ID and basic user information in the session.
6. `req.session.save()` saves the session.
7. The API returns a successful response.

### Protected request workflow

1. The browser sends the session cookie.
2. `express-session` attempts to load the session from the MySQL session store.
3. `authenticateUser()` checks for a logged-in user ID.
4. The middleware rejects unauthenticated requests or calls `next()`.
5. The protected handler returns the requested response.

### Logout workflow

1. The client sends a logout request.
2. `authenticateUser()` checks the current session.
3. `logoutUser()` destroys the session.
4. The server clears the `auth.sid` cookie.
5. The next protected request should be rejected.

## Testing the Backend

Use Postman or Thunder Client.

Test the following cases:

- Register a valid user and confirm the user is created.
- Register the same email again and expect `409`.
- Submit invalid registration fields and expect `400`.
- Log in using correct credentials and expect `200`.
- Log in using incorrect credentials and expect `401`.
- Request `/api/auth/me` without a session and expect `401`.
- Request `/api/auth/me` after login and expect `200`.
- Access `/api/auth/private` after login and expect `200`.
- Log out and expect `200`.
- Request `/api/auth/me` after logout and expect `401`.
- Verify that a session is stored in MySQL during login and removed after logout.

When testing cookie-based endpoints, keep the cookie jar enabled in your API client so that it sends the session cookie on later requests.

## Security Considerations

- Never store plain-text passwords.
- Never commit `.env` or expose database credentials and session secrets.
- Use HTTPS and secure cookie settings in production.
- Keep the session cookie `httpOnly`.
- Use generic login error messages to avoid revealing whether an account exists.
- Consider rate limiting login and registration requests.
- Add appropriate CSRF protection for cookie-based authentication in the deployed application.
- Authentication does not automatically grant administrator permissions. Admin-only routes must check the user's role.
- Email verification and password reset must be implemented and tested before they are considered supported features.
- Do not delete production session data as part of routine testing.

## Team Collaboration with Git

### Get the latest code

```bash
git switch main
git pull origin main
```

### Create a feature branch

For example, when starting email verification:

```bash
git switch -c feature/email-verification
```

### Save your changes

```bash
git add .
git commit -m "Describe your changes"
```

### Push your branch

```bash
git push -u origin feature/email-verification
```

Then open a pull request on GitHub for code review and merging.

### Team guidelines

- Pull the latest changes before beginning new work.
- Use feature branches for new features and fixes.
- Test changes before committing.
- Write meaningful commit messages.
- Do not commit `.env`, passwords, tokens, or other secrets.
- Coordinate changes to shared files such as `server.js` and `authController.js`.
- Never push directly to `main` if the team has agreed to use pull requests.

## Remaining Roadmap

1. **Phase 8 — Email verification:** Generate secure tokens, send verification emails, validate tokens, and mark accounts as verified.
2. **Phase 9 — Password management:** Implement forgot-password, reset-password, and authenticated password-change workflows.
3. **Phase 10 — Authorization and security:** Implement role-based authorization, rate limiting, and additional security controls.
4. **Phase 11 — Backend final testing:** Test all API workflows, errors, sessions, token expiration, and configuration.
5. **React integration:** Connect the frontend forms and protected pages to the completed backend.

## Contribution

Team members are encouraged to review the code, report issues, test API endpoints, and contribute through feature branches and pull requests.

Before implementing a new feature, review the existing architecture and coordinate the change with the team.

---

**Project status:** Core backend authentication through Phase 7 completed. Email verification, password recovery, final backend hardening, and React integration remain on the roadmap.
