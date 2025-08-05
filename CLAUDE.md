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

### Key Files to Understand
- `shared/schema.ts` - Complete database schema and Zod validation schemas
- `server/routes.ts` - All API endpoints and business logic
- `server/storage.ts` - Data access layer
- `client/src/lib/menu-data.ts` - Mock data and utilities