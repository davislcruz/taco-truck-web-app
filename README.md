# Taco Truck Web App 🌮

A full-stack web application for a Mexican restaurant featuring an online menu system with customer ordering capabilities and an admin dashboard for order management.

## What is this app?

This is a modern, responsive web application built for Mexican restaurants and food trucks. It provides a complete digital solution for menu management, customer ordering, and business operations. The application features a beautiful, mobile-first design with bilingual support (English/Spanish) and integrates with Stripe for secure payment processing.

## What does it do?

### For Customers:
- **Browse Menu**: View categorized menu items (tacos, burritos, tortas, semitas, drinks) with prices and descriptions
- **Customize Orders**: Add items to cart with customization options (meats, toppings, sizes)
- **Place Orders**: Submit orders with phone number for pickup
- **Order Tracking**: Track order status (received, preparing, ready, completed)
- **Bilingual Support**: Switch between English and Spanish

### For Restaurant Owners:
- **Admin Dashboard**: Comprehensive management interface
- **Menu Management**: Add, edit, delete menu items and categories
- **Order Management**: View all orders, update status, search by phone number
- **Real-time Updates**: Live order status changes
- **Analytics**: Track orders and business metrics

## Who is this app for?

- **Mexican Restaurants** looking to digitize their ordering process
- **Food Trucks** wanting an online presence and ordering system
- **Small Food Businesses** needing an affordable, complete solution
- **Restaurant Owners** who want to streamline operations and reduce phone orders
- **Customers** who prefer ordering online over calling

## Features

### Technical Features
- **Full-stack TypeScript** application
- **React 18** with modern hooks and components
- **Express.js** RESTful API backend
- **PostgreSQL** database with Drizzle ORM
- **Session-based authentication** with Passport.js
- **Responsive design** with Tailwind CSS
- **Real-time updates** for order status
- **Payment integration** with Stripe
- **Bilingual interface** (English/Spanish)

### Business Features
- **Menu categorization** with customizable options
- **Order management system** with status tracking
- **Customer phone-based identification**
- **Estimated preparation times**
- **Admin role management**
- **Search and filter capabilities**

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** (for database)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:davislcruz/taco-truck-web-app.git
   cd taco-truck-web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   Create and start a PostgreSQL container:
   ```bash
   docker run --name postgres-taco \
     -e POSTGRES_DB=taco_truck \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     -d postgres:15
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Docker PostgreSQL database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/taco_truck"
   
   # Session secret for authentication
   SESSION_SECRET="your-secret-key-here"
   
   # Stripe keys (optional for testing)
   # STRIPE_SECRET_KEY="your-stripe-secret-key"
   # STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   ```

5. **Set up the database schema**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   
   Open your browser and visit: **http://localhost:5000**

### Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123`

## Project Structure

```
taco-truck-web-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── shared/               # Shared types and schemas
└── package.json         # Project dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Apply database schema changes
- `npm run check` - Type checking

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack React Query** for state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Passport.js** for authentication
- **Drizzle ORM** with PostgreSQL
- **Express sessions** for state management

### Database & Infrastructure
- **PostgreSQL 15** database
- **Docker** for containerization
- **Neon Database** (production ready)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for the Mexican food community 🌮