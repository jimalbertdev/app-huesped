# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VACANFLY Guest Application** - A hospitality management system for vacation rentals. The application features a React TypeScript frontend with a PHP REST API backend, enabling guests to register, manage preferences, unlock doors, and access their accommodation information through an interactive dashboard.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI: shadcn/ui components + Tailwind CSS
- State: React Query (@tanstack/react-query) + Context API
- Backend: PHP REST API with PDO
- Database: MySQL (moon_desarrollo)
- Routing: React Router v6

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production (outputs to /web/site/)
npm run build

# Build for development environment
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm preview
```

### Backend Development
```bash
# Install database schema
cd database && php install.php

# Test API endpoints
cd api && php test.php

# Health check
curl http://localhost/app_huesped/api/health
```

### Testing API Endpoints
```bash
# Get reservation by code
curl http://localhost/app_huesped/api/reservations/RES-2024-001

# Get dashboard data
curl http://localhost/app_huesped/api/reservations/1/dashboard

# Register a guest (POST)
curl -X POST http://localhost/app_huesped/api/guests \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": 1, "first_name": "John", ...}'
```

## Architecture

### Frontend Structure

**Routing Flow:**
1. `/` - Welcome page (enter reservation code)
2. `/register` - Guest registration (scan/manual ID entry)
3. `/register/preferences` - Stay preferences (beds, arrival time, special requests)
4. `/register/terms` - Terms acceptance
5. `/register/confirmation` - Registration complete
6. `/dashboard` - Main guest dashboard (access info, services, local guide)

**Key Contexts:**
- `LanguageProvider` (src/hooks/useLanguage.tsx) - Multi-language support (es/en/fr/de/pt)
- `ReservationProvider` (src/hooks/useReservation.tsx) - Reservation state management

**Path Aliases:**
- `@/*` maps to `src/*` for clean imports

**Production Deployment:**
- Base path: `/web/site/` (configured in App.tsx and vite.config.ts)
- Controlled by `import.meta.env.PROD` environment variable

### Backend Architecture

**Directory Structure:**
```
api/
├── config/          # Database and CORS configuration
├── includes/        # Database.php (PDO wrapper), Response.php (JSON helper)
├── models/          # Data models (Reservation, Guest, Preference, DoorUnlock, Incident, LocalGuide)
├── endpoints/       # API route handlers (reservations, guests, preferences, doors, incidents)
└── index.php        # Main router
```

**API Pattern:**
- All endpoints return standardized JSON: `{success: bool, message: string, data: object}`
- CORS enabled for all origins in development (configure for production)
- Router pattern: `/api/{resource}/{id|action}`

**Database Connection:**
- Host: localhost:3306
- Database: moon_desarrollo
- User: root
- Password: 12345678 (configured in api/config/database.php)

### Key Database Tables

- `hosts` - Property owners
- `accommodations` - Rental properties (wifi, access codes, amenities)
- `reservations` - Bookings with unique reservation_code
- `guests` - Registered guests (supports multiple guests per reservation)
- `preferences` - Stay preferences (beds, arrival time, special requests)
- `door_unlocks` - History of door/portal access attempts
- `incidents` - Guest complaints/suggestions/maintenance requests
- `local_guide_items` - Recommended places (restaurants, cafes, activities)
- `welcome_videos` - Onboarding video content

**Important Views:**
- `guest_view_dashboard` - Combines reservation, accommodation, and guest data for dashboard

### State Management Pattern

**Global State:**
- Use `useReservation()` hook to access/update reservation data across components
- Use `useLanguage()` hook for translations and language switching
- React Query for server state (API data fetching)

**Local State:**
- Component-level useState for UI state
- Form state managed by react-hook-form + zod validation

### API Integration

**Service Layer:** src/services/api.ts

Services automatically detect environment and adjust API base URL:
- Development: `http://{hostname}/app_huesped/api`
- Production: `{protocol}://{host}/app_huesped/api`

**Usage Pattern:**
```typescript
import { reservationService, guestService } from '@/services/api';

const response = await reservationService.getByCode('RES-2024-001');
if (response.data.success) {
  const reservation = response.data.data;
}
```

## Important Conventions

### TypeScript Configuration
- `noImplicitAny: false` - Implicit any is allowed
- `strictNullChecks: false` - Null checks not enforced
- `skipLibCheck: true` - Skip type checking of declaration files
- Path alias `@/*` configured for clean imports

### Component Patterns
- All UI components in src/components/ui/ are from shadcn/ui
- Page components in src/pages/ represent full routes
- Use shadcn/ui components for consistency (Button, Card, Dialog, Toast, etc.)

### Database Date Handling
- Timezone: Europe/Madrid (configured in api/config/database.php)
- Date format: YYYY-MM-DD for check-in/check-out dates
- Timestamps use MySQL CURRENT_TIMESTAMP

### Multi-Guest Support
- One reservation can have multiple guests
- Mark one guest as `is_responsible: true` (reservation holder)
- Each guest has individual document verification

### Door Unlock System
- Two door types: 'portal' (building entrance) and 'accommodation' (unit door)
- All unlock attempts logged in `door_unlocks` table
- Status tracked: 'success', 'failed', 'pending'

## Security Notes

### Development Mode (Current)
- CORS: All origins allowed (`*`)
- Error display: Enabled
- Database credentials: Stored in plaintext in api/config/database.php

### Production Checklist
1. Update CORS in api/config/cors.php to specific domain
2. Disable error display in api/config/database.php
3. Use environment variables for database credentials
4. Enable HTTPS
5. Add rate limiting to API endpoints
6. Sanitize all user inputs (currently basic validation only)

## Common Patterns

### Adding a New API Endpoint
1. Create model class in api/models/ (if needed)
2. Create endpoint file in api/endpoints/
3. Add route case in api/index.php
4. Add service method in src/services/api.ts
5. Update INSTRUCCIONES.md with endpoint documentation

### Adding a New Page
1. Create component in src/pages/
2. Add route in src/App.tsx
3. Update navigation flow if needed
4. Ensure proper route protection (check reservation state)

### Language Support
- Use `t()` function from `useLanguage()` hook
- Add translations in src/hooks/useLanguage.tsx
- Supported languages: es (default), en, fr, de, pt

## Data Flow Example

**Guest Registration Flow:**
1. User enters reservation code on Welcome page
2. API validates code → GET `/api/reservations/{code}`
3. Reservation data stored in ReservationProvider context
4. User completes registration form → POST `/api/guests`
5. User sets preferences → POST `/api/preferences`
6. User accepts terms → PUT `/api/guests/{id}` (update accepted_terms)
7. Redirect to Dashboard → GET `/api/reservations/{id}/dashboard`

## Testing

### Manual API Testing
Use the provided test script: `php api/test.php`

This tests all major endpoints and validates responses.

### Frontend Testing
The project uses Vite dev server with fast refresh. No automated test framework configured.

## Known Limitations

- No authentication/authorization system implemented
- No file upload functionality for document images (paths stored as strings)
- No real door unlock integration (API logs attempts but doesn't control hardware)
- No email notifications configured
- Database credentials hardcoded (not using environment variables)
- No API rate limiting
- Limited input validation on frontend forms
