# HaH Real Estates

A full-stack real estate marketplace connecting **Customers** and **Brokers**. Customers can browse listings, save favourites, submit purchase offers, and book site visits. Brokers can manage and publish properties, review submissions, process deals, and track analytics.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Features

### Customer
- Browse and filter property listings (type, price, location, offer type)
- View property details with an interactive map and nearby amenities
- Save / unsave favourite properties
- Book and manage site visits
- Submit purchase offers and track deal status
- View recently seen properties and transaction history
- Built-in EMI calculator

### Broker
- Create, edit, and publish property listings with image uploads
- Approve or reject customer-submitted property leads
- Manage a deal pipeline with a Kanban-style view
- Handle site-visit requests (confirm, reschedule, cancel)
- Dashboard analytics with charts (Recharts)
- Proximity search — find properties within a configurable radius

### General
- JWT-based authentication (access token 24 h · refresh token 7 d with rotation)
- Role-based access control enforced at both the Spring Security filter layer and the service layer
- Soft-delete on properties guarded against active deals
- Pagination on all list endpoints

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS v4 |
| State management | Redux Toolkit |
| Routing | React Router v7 |
| Forms & validation | React Hook Form + Yup |
| Maps | Leaflet / React-Leaflet |
| Charts | Recharts |
| HTTP client | Axios |
| Frontend testing | Vitest + Testing Library |
| Backend | Spring Boot 4.0.5 (Java 17) |
| Security | Spring Security + JJWT 0.11.5 (HS256) |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL 8 |
| API docs | SpringDoc OpenAPI 2.6.0 (Swagger UI) |
| Build tools | Maven (backend), Vite (frontend) |
| File storage | Local disk (`uploads/property-images/`) |

---

## Architecture Overview

```
frontend/          React SPA
  └── Axios ──────────────────────────────────► :8080
                                                 Spring Boot REST API
                                                   ├── Spring Security (JWT filter)
                                                   ├── Controllers   (/api/**)
                                                   ├── Services      (business logic)
                                                   ├── Repositories  (Spring Data JPA)
                                                   └── MySQL 8  (realestate schema)
```

The backend follows a layered package structure:

- **`presentation`** — REST controllers
- **`application`** — services, DTOs, mappers
- **`domain`** — JPA entities and enums
- **`infrastructure`** — repositories and JPA specifications
- **`config`** — security, OpenAPI, data/schema initializers
- **`comon`** — global exception handler

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|---|---|
| Java | 17 |
| Maven | 3.9+ (or use the included `mvnw` wrapper) |
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8.0+ |

### Database Setup

1. Create the schema:
   ```sql
   CREATE DATABASE realestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Create a dedicated user (recommended) or use your existing `root` account and note the password for the environment variables below.

Hibernate is configured with `ddl-auto: update`, so all tables are created automatically on first startup.

### Backend Setup

```bash
cd backend

# Copy and edit the environment file
cp .env.example .env          # create this file — see Environment Variables below

# Build (skipping tests for a quick first run)
./mvnw clean package -DskipTests

# Run
./mvnw spring-boot:run
```

> Windows users: replace `./mvnw` with `mvnw.cmd`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The development server starts at `http://localhost:5173`.

---

## Environment Variables

The backend reads the following variables from the environment (or falls back to defaults for local development). **Override all of them before deploying to any shared or production environment.**

| Variable | Default (dev only) | Description |
|---|---|---|
| `DB_PASSWORD` | `admin@123` | MySQL password for the `realestate` schema |
| `JWT_SECRET` | *(hardcoded fallback — see warning)* | HS256 signing key — **must be a cryptographically random string of at least 64 characters** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed CORS origins |
| `APP_UPLOAD_BASE_URL` | `http://localhost:8080/uploads/property-images` | Public base URL used to construct image URLs returned by the API |

> **Security notice:** The `application-dev.yml` file contains a hardcoded fallback value for `JWT_SECRET`. Always set `JWT_SECRET` as a real environment variable in any non-local environment and never commit a real secret to source control.

---

## Running the Application

| Command | What it does |
|---|---|
| `./mvnw spring-boot:run` (backend) | Starts the API server on port **8080** |
| `npm run dev` (frontend) | Starts the Vite dev server on port **5173** |
| `npm run build` (frontend) | Produces a production build in `frontend/dist/` |
| `npm run preview` (frontend) | Serves the production build locally |

### Seed accounts

See `backend/SEED_CREDENTIALS.md` for pre-seeded user accounts created by `DataInitializer` on startup.

---

## API Documentation

Interactive Swagger UI is available while the backend is running:

```
http://localhost:8080/swagger-ui/index.html
```

All secured endpoints require a `Bearer <access_token>` header. You can obtain a token via `POST /api/auth/login` and paste it into the **Authorize** dialog in Swagger UI.

### Main endpoint groups

| Prefix | Description |
|---|---|
| `/api/auth/**` | Register, login, refresh token |
| `/api/properties/**` | Property CRUD, search, approval, image upload |
| `/api/deals/**` | Deal creation and pipeline management |
| `/api/favorites/**` | Save / unsave listings |
| `/api/site-visits/**` | Book, confirm, reschedule, cancel visits |
| `/api/users/**` | Profile, analytics, recently-viewed |
| `/api/proximity/**` | Haversine-based radius search |

---

## Testing

### Backend

```bash
cd backend
./mvnw test
```

Test reports are written to `backend/target/surefire-reports/`.

### Frontend

```bash
cd frontend
npm test            # run once
npm run test:watch  # watch mode
```

Frontend tests use **Vitest** with **jsdom** and **Testing Library**.

---

## Project Structure

```
HaH Real Estates/
├── backend/
│   ├── src/main/java/com/dayforce/backend/
│   │   ├── config/          # Security, OpenAPI, data/schema initializers
│   │   ├── domain/          # JPA entities and enums
│   │   ├── application/     # Services, DTOs, mappers
│   │   ├── infrastructure/  # Repositories, JPA specifications
│   │   ├── presentation/    # REST controllers
│   │   └── comon/           # Global exception handler
│   └── src/main/resources/
│       ├── application.yml          # Activates dev profile
│       └── application-dev.yml      # Full dev configuration
├── frontend/
│   └── src/
│       ├── features/        # Page-level feature modules (auth, dashboard, property, …)
│       ├── components/      # Shared UI components
│       ├── store/           # Redux store and slices
│       ├── services/        # Axios instance and API calls
│       ├── hooks/           # Custom React hooks
│       ├── utils/           # Constants, enums, normalizers
│       └── __tests__/       # Vitest test files
├── CODEBASE_AUDIT_REPORT.md
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## License

This project is for educational / portfolio purposes. No licence has been explicitly assigned.
