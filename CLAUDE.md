# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (both client and server on port 5000)
- `npm run build` - Build for production (Vite + esbuild bundle)
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Apply database schema changes using Drizzle Kit

## Architecture Overview

This is a full-stack TypeScript Mexican restaurant web application with the following key architectural patterns:

### Stack
- **Frontend**: React 18 with Vite, Tailwind CSS, Radix UI components
- **Backend**: Express.js with session-based authentication (Passport.js)
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend with API routes
- `shared/` - Shared types and database schema (Drizzle)
- Database schema is defined in `shared/schema.ts` using Drizzle ORM

### Key Components Architecture
- **Menu Management**: Modular component system with drag-and-drop category ordering
- **Order System**: Real-time order status updates with phone-based customer identification
- **Authentication**: Session-based auth with owner/employee roles
- **Bilingual Support**: English/Spanish translations throughout the application

### Database Design
Four main entities: `users`, `categories`, `menu_items`, `orders`
- Categories have translatable names and customizable ingredient lists
- Menu items support arrays for meats, ingredients, and sizes
- Orders use JSONB for flexible item storage and phone-based identification

### API Routes Pattern
- Public routes: `/api/categories`, `/api/menu`, `/api/orders` (POST only)
- Protected routes: All management endpoints require authentication
- Stripe integration with mock payment support for development

### Development Environment
- Requires PostgreSQL database (Docker setup provided in README)
- Environment variables needed: `DATABASE_URL`, `SESSION_SECRET`
- Optional Stripe keys for payment testing
- Default admin credentials: username `admin`, password `admin123`

### Docker Database Setup
```bash
docker run --name postgres-taco \
  -e POSTGRES_DB=taco_truck \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### Key Files to Understand
- `shared/schema.ts` - Complete database schema and Zod validation schemas
- `server/routes.ts` - All API endpoints and business logic
- `server/storage.ts` - Data access layer
- `client/src/lib/menu-data.ts` - Mock data and utilities
- `server/auth.ts` - Authentication logic with Passport.js
- `server/db.ts` - Database connection setup

## DaisyUI Theme System

This application includes a comprehensive DaisyUI theme selector with accurate theme previews.

### Theme Preview Implementation
- **File**: `client/src/components/daisyui-theme-selector.tsx`
- **Purpose**: Allows users to preview and select from all 35 official DaisyUI themes
- **Key Feature**: Each theme preview card displays the actual colors of that specific theme

### Dynamic Color Extraction System
**Why we extract colors instead of hardcoding:**
1. **Accuracy**: Ensures 100% accurate representation of official DaisyUI theme colors
2. **Maintainability**: Automatically adapts if DaisyUI updates their theme colors
3. **Consistency**: Eliminates discrepancies between preview and actual theme appearance
4. **User Experience**: Users see exactly what each theme will look like before selecting

**How color extraction works:**
1. Creates temporary DOM elements with `data-theme` attribute for each theme
2. Applies DaisyUI semantic classes (`bg-primary`, `text-primary-content`, etc.)
3. Reads computed CSS styles to extract actual RGB color values
4. Uses extracted colors for theme preview cards and internal preview elements

### DaisyUI Semantic Color Usage
**Important**: The implementation follows DaisyUI's semantic color system:
- `base` + `base-content` for card backgrounds and text
- `primary` + `primary-content` for header previews
- `accent` + `accent-content` for button previews
- `secondary` + `secondary-content` for section headers

This ensures proper contrast and readability across all 35 themes, from light themes like "Light" and "Cupcake" to dark themes like "Dark", "Dracula", and "Night".

### Theme Configuration
- **CSS File**: `client/src/index.css` contains all 35 theme configurations
- **Tailwind Config**: Uses Tailwind v4 syntax with DaisyUI plugin
- **Theme Persistence**: Selected theme is saved to database via `/api/settings/app_theme`