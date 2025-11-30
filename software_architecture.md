# Software Architecture - App Huesped

## 1. Introduction
This document provides a comprehensive overview of the software architecture for the **App Huesped** application. It is designed to serve as a guide for new developers starting on the project or for anyone looking to understand the system's design and structure.

**App Huesped** is a full-stack web application designed to manage the guest experience, including online check-in, digital key access, and accommodation information.

## 2. Technology Stack

### 2.1 Frontend (Client-Side)
*   **Framework:** [React](https://react.dev/) (v18.3.1)
*   **Build Tool:** [Vite](https://vitejs.dev/) (v5.4.19)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (v5.8.3)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v3.4.17) & [Shadcn/UI](https://ui.shadcn.com/)
*   **State Management:** [TanStack Query](https://tanstack.com/query/latest) & React Context
*   **Routing:** [React Router DOM](https://reactrouter.com/)

### 2.2 Backend (Server-Side)
*   **Language:** PHP (v8.x)
*   **Framework:** Custom Native PHP (No external framework like Laravel/Symfony)
*   **Dependency Manager:** [Composer](https://getcomposer.org/)
*   **Database:** MySQL / MariaDB
*   **Key Libraries:**
    *   `vlucas/phpdotenv`: Environment variable management.
    *   `mpdf/mpdf`: PDF generation (contracts).
    *   `giggsey/libphonenumber-for-php`: Phone number validation.

## 3. Project Structure

The project is organized as a monorepo containing both frontend and backend code.

```
/
├── api/                 # Backend API Code
│   ├── config/          # Database & CORS configuration
│   ├── endpoints/       # API Endpoint Handlers (Controllers)
│   ├── includes/        # Shared utilities (Database, Response)
│   ├── middleware/      # Request middleware
│   ├── models/          # Data Access Objects (DAO)
│   ├── vendor/          # Composer dependencies
│   ├── composer.json    # Backend dependencies
│   └── index.php        # API Entry Point & Router
├── database/            # Database Artifacts
│   ├── migrations/      # Database migration scripts
│   └── schema.sql       # Full database schema definition
├── src/                 # Frontend React Code
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks & Context
│   ├── pages/           # Page components
│   ├── services/        # Frontend API service layer
│   └── App.tsx          # Main React Application
├── public/              # Static assets
├── .env                 # Environment variables (Shared)
├── package.json         # Frontend dependencies
└── vite.config.ts       # Vite configuration
```

## 4. Frontend Architecture

### 4.1 Component-Based Architecture
The UI is built using small, reusable components.
*   **UI Components:** Located in `src/components/ui`, based on Shadcn/UI.
*   **Feature Components:** Larger components that compose UI components to implement specific features.
*   **Pages:** Top-level components located in `src/pages`.

### 4.2 Service Layer Pattern
API interactions are abstracted into `src/services/api.ts`.
*   **`api` instance:** Pre-configured Axios instance.
*   **Service Objects:** Grouped methods (e.g., `reservationService`, `guestService`).

### 4.3 State Management
*   **Server State:** React Query handles caching and synchronization.
*   **Client State:** React Context (`LanguageProvider`, `ReservationProvider`) for global app state.

## 5. Backend Architecture

### 5.1 Entry Point & Routing
The backend uses a **Single Entry Point** pattern.
*   **File:** `api/index.php`
*   **Logic:** It captures all requests to `/api/*`, parses the `REQUEST_URI`, and switches based on the resource name (e.g., `reservations`, `guests`) to include the appropriate endpoint file.
*   **Routing Logic:** Manual parsing without a routing library.

### 5.2 Endpoint Handlers (Controllers)
Located in `api/endpoints/`, these files handle specific resource requests.
*   **Structure:** Each file checks the HTTP method (`GET`, `POST`, etc.) and executes the corresponding logic.
*   **Example:** `api/endpoints/reservations.php` handles `GET /reservations/{code}`.

### 5.3 Data Access Layer (Models)
Located in `api/models/`, these classes wrap database interactions.
*   **Pattern:** Active Record / DAO hybrid.
*   **Database Connection:** Uses a `Database` class (`api/includes/Database.php`) that wraps `PDO`.
*   **Example:** `Reservation::getByCode($code)` executes the SQL query and returns an associative array.

### 5.4 Configuration
*   **Database:** `api/config/database.php` loads environment variables from `.env` and establishes the connection.
*   **CORS:** `api/config/cors.php` handles Cross-Origin Resource Sharing headers.

## 6. Database Schema

The database is Relational (SQL). Key tables include:

*   **`hosts`**: Property owners/managers.
*   **`accommodations`**: Properties available for rent. Linked to `hosts`.
*   **`reservations`**: Booking records. Linked to `accommodations`.
    *   Status: `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`.
*   **`guests`**: People staying in the reservation. Linked to `reservations`.
    *   Includes PII (Personal Identifiable Information) and document data.
*   **`preferences`**: Guest preferences (beds, arrival time). Linked to `reservations`.
*   **`door_unlocks`**: Audit log of digital key usage.
*   **`incidents`**: Issues reported by guests.
*   **`local_guide_items`**: Recommendations (restaurants, etc.) for the accommodation.

*See `database/schema.sql` for the complete DDL.*

## 7. Development Guidelines

### 7.1 Adding a New Feature (Full Stack)

1.  **Database:**
    *   Add new tables or columns in `database/schema.sql` (and create a migration if the DB is live).
2.  **Backend Model:**
    *   Create `api/models/NewEntity.php`.
    *   Implement methods like `create`, `getById`, `update`.
3.  **Backend Endpoint:**
    *   Create `api/endpoints/new-entity.php`.
    *   Handle HTTP methods (`GET`, `POST`).
    *   Register the endpoint in `api/index.php` switch case.
4.  **Frontend Service:**
    *   Add methods to `src/services/api.ts` under `newEntityService`.
5.  **Frontend UI:**
    *   Create components/pages to consume the data.

### 7.2 Environment Variables
The project uses a single `.env` file at the root for both frontend and backend.
*   **DB_HOST, DB_NAME, DB_USER, DB_PASS:** Database credentials.
*   **VITE_***: Variables exposed to the frontend build.

## 8. Setup & Installation

1.  **Clone the repository.**
2.  **Frontend Setup:**
    ```bash
    npm install
    npm run dev
    ```
3.  **Backend Setup:**
    *   Ensure PHP 8.x and Composer are installed.
    *   Run `composer install` inside the `api` directory.
    *   Configure Apache/Nginx to serve the root directory.
    *   Ensure URL rewriting is enabled so all `/api/*` requests go to `api/index.php`.
4.  **Database:**
    *   Create a MySQL database.
    *   Import `database/schema.sql`.
    *   Update `.env` with credentials.

## 9. Deployment

*   **Frontend:** Build with `npm run build`. The `dist` folder contains static files.
*   **Backend:** Copy the `api` folder and `vendor` directory to the server.
*   **Web Server:** Configure the web server to serve `dist` as the document root for the web app, and alias `/app_huesped/api` to the backend entry point.

## 10. Security & Performance Standards

This section outlines the security layers currently in place and the standards required for all future developments to ensure robustness and efficiency.

### 10.1 Security Layers

#### 10.1.1 Network Security (CORS)
*   **Implementation:** `api/config/cors.php`
*   **Standard:** All endpoints must respect the CORS policy defined by the `ALLOWED_ORIGINS` environment variable.
*   **Requirement:** Never hardcode allowed origins. Always use the configuration.

#### 10.1.2 Database Security (SQL Injection)
*   **Implementation:** `api/includes/Database.php` uses PDO with Prepared Statements.
*   **Standard:** **NEVER** concatenate variables directly into SQL strings.
*   **Requirement:** Always use `?` or `:param` placeholders and pass values via the execution array.
    *   ✅ Correct: `$db->query("SELECT * FROM users WHERE id = ?", [$id])`
    *   ❌ Forbidden: `$db->query("SELECT * FROM users WHERE id = " . $id)`

#### 10.1.3 Access Control & Rate Limiting
*   **Implementation:** `api/middleware/RateLimit.php` & `ValidateReservation.php`
*   **Standard:**
    *   Public endpoints must have Rate Limiting applied (`RateLimit::apply()`).
    *   Reservation-specific endpoints must validate the reservation status and dates using `ValidateReservation::validate()`.
*   **Requirement:** Ensure sensitive actions (like door unlocking) have stricter rate limits.

#### 10.1.4 Input Validation
*   **Frontend:** Zod schemas in `src/schemas` ensure data shape before sending.
*   **Backend:** All incoming data (`$_POST`, `php://input`) must be validated and sanitized before processing.
*   **Requirement:** Do not trust frontend validation alone. Validate types, lengths, and formats on the backend.

### 10.2 Performance Standards

#### 10.2.1 Database Optimization
*   **Indexing:** All columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses must be indexed.
*   **N+1 Problem:** Avoid executing queries inside loops. Use `JOIN`s or fetch related data in bulk.

#### 10.2.2 Caching Strategy
*   **Frontend:** React Query handles server state caching. Configure `staleTime` appropriately to minimize network requests.
*   **Backend:** For heavy read-only data (like statistics), implement server-side caching (e.g., Redis or file-based) if traffic scales.

#### 10.2.3 Code Efficiency
*   **Strict Typing:** Use PHP 7.4+ / 8.0+ type hinting for function parameters and return types to catch errors early and improve engine optimization.
*   **Asset Optimization:** Vite automatically minifies assets. Ensure images are optimized before upload or use an image optimization service.
