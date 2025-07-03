# Mexican Restaurant Web Application

## Overview

This is a full-stack web application for a Mexican restaurant, featuring an online menu system with customer ordering capabilities and an admin dashboard for order management. The application provides a bilingual interface (English/Spanish) and integrates with Stripe for payment processing.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom Mexican-themed color palette
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: Express sessions with configurable store (memory or PostgreSQL)
- **Password Security**: Node.js crypto with scrypt hashing
- **API Design**: RESTful endpoints with JSON responses

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon Database serverless driver
- **Schema Management**: Drizzle Kit for migrations
- **Fallback Storage**: In-memory storage for development/testing

## Key Components

### Database Schema
The application uses three main tables:
- **users**: Admin authentication (id, username, hashed password)
- **menu_items**: Product catalog with multilingual support (name, translation, category, price, description, customization options)
- **orders**: Customer orders with JSON items storage (order_id, phone, items, total, status, timestamp)

### Authentication System
- Session-based authentication using Passport.js
- Secure password hashing with salt using Node.js scrypt
- Protected routes for admin functionality
- Configurable session storage (memory store with PostgreSQL option)

### Menu Management
- Categorized menu items (tacos, burritos, tortas, semitas, drinks)
- Bilingual item names and descriptions
- Customizable options (meats, toppings, sizes)
- Dynamic pricing with add-on calculations
- Image support for menu items

### Order Processing
- Shopping cart functionality with item customization
- Phone-based customer identification
- Order status tracking (received, preparing, ready, completed)
- Estimated preparation times
- Admin dashboard for order management

## Data Flow

1. **Menu Display**: Client fetches menu items from `/api/menu`, displays categorized items with bilingual labels
2. **Order Creation**: Customer adds customized items to cart, provides phone number, submits order to `/api/orders`
3. **Payment Processing**: Integration with Stripe for secure payment handling
4. **Order Management**: Admin can view all orders, update status, search by phone number
5. **Real-time Updates**: Order status changes reflected through API polling

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for secure payment processing
- **Client**: @stripe/stripe-js and @stripe/react-stripe-js
- **Server**: stripe npm package with webhook support

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **Connect-pg-simple**: PostgreSQL session store

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Development Server**: Vite dev server with HMR
- **Port Configuration**: Local port 5000, external port 80

### Production Build
- **Client**: Vite production build to `dist/public`
- **Server**: esbuild bundling to `dist/index.js`
- **Deployment**: Replit autoscale with build commands
- **Environment Variables**: DATABASE_URL, STRIPE_SECRET_KEY, SESSION_SECRET

### Configuration Files
- **TypeScript**: Shared config for client, server, and shared modules
- **Tailwind**: Custom theme with Mexican restaurant branding
- **Drizzle**: PostgreSQL dialect with schema migrations
- **Package.json**: Scripts for dev, build, start, and database operations

## Changelog

```
Changelog:
- July 2, 2025. Updated category icons - changed burritos from wrap-text to beef icon, changed semitas from cookie to sandwich icon (same as tortas) for better food representation
- July 2, 2025. Fixed "View Customer Page" button functionality - owners can now properly view customer ordering experience without being redirected back to dashboard, uses sessionStorage flag system
- July 2, 2025. Created dedicated owner dashboard page at /dashboard route - owners automatically redirect to dashboard after login, includes "View Customer Page" link to see regular customer experience, removed embedded dashboard from home page
- July 2, 2025. Replaced all remaining emojis with professional Lucide React icons throughout application - chili pepper emojis now ChefHat icons, user emoji now User icon, updated category icon input to reference Lucide icon names
- July 2, 2025. Fixed bottom navigation overlap issue by adding padding-bottom to menu section, ensuring last menu category is fully visible above navigation bar
- June 29, 2025. Implemented role-based authentication system - removed registration functionality, added user roles (owner/employee), login-only access with admin credentials: admin/admin123
- June 29, 2025. Made arrow button and dot navigation instant (removed transition animations)
- June 29, 2025. Updated all navigation containers to match card width (280px small screens, 452px large screens) with restructured title/button layout using flex siblings and separated tagline containers
- June 28, 2025. Implemented responsive card width system - cards now adapt to screen size below 491px (viewport-32px padding, min 280px) while maintaining 452px fixed width above 491px, with proportional drag thresholds and dynamic carousel dimensions
- June 28, 2025. Repositioned navigation buttons inward (left-16/right-16) from card edges while maintaining vertical alignment, centered card container with mx-auto for better layout balance
- June 28, 2025. Fixed price badge clipping by moving outside overflow container with absolute positioning and custom margin classes (mt-[-14px] mb-[-14px] ml-[-22px] mr-[-22px]) for proper sticker appearance
- June 28, 2025. Fixed tortas and semitas cards appearing blank by adjusting carousel positioning for single-item categories - single items now use proper centering (translateX: 0px) while multi-item categories maintain carousel behavior
- June 28, 2025. Separated navigation methods completely - arrow buttons and dots use continuous sliding effects (500ms duration), manual drag uses simple snap-back behavior with independent coordinate systems for smooth bidirectional dragging
- June 28, 2025. Implemented proper sliding carousel transitions for menu items - cards now slide in from appropriate directions during drag/navigation, with smooth animations for arrow buttons, navigation dots, and manual swipe gestures
- June 20, 2025. Added responsive card layouts with custom breakpoints (xxs: 480px, xs: 540px), implemented dynamic aspect ratios (4:3 mobile, 1:1 desktop), optimized image positioning
- June 18, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```