# Taco Truck Web App 🌮

A simple, full-stack web application for a Mexican restaurant featuring an online menu system with customer ordering capabilities and an admin dashboard for order management.

**Built with:** FastAPI + Jinja2 + Tailwind CSS (CDN) + HTMX + Vanilla JS

**No Node.js required!** 🎉

## Features

### For Customers
- 📋 Browse categorized menu (tacos, burritos, tortas, drinks)
- 🛒 Add items to cart with quantity controls
- 📱 Place orders with phone number for pickup
- 🔔 Track order status (pending → confirmed → preparing → ready → completed)

### For Restaurant Owners
- 📊 Admin dashboard with active orders
- 📋 Menu management (add, edit, delete items)
- 📦 Order management with status updates
- 🔍 Search orders by phone number

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) |
| Templates | Jinja2 |
| CSS | Tailwind CSS (CDN) |
| Interactivity | HTMX + Vanilla JS |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy (async) |
| Auth | JWT sessions |

## Quick Start

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Clone the repo
git clone git@github.com:davislcruz/taco-truck-web-app.git
cd taco-truck-web-app

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the app
python -m app.main
```

### Seed Database (Development)

```bash
# With the server running, visit:
http://localhost:8000/dev/seed
```

This creates:
- Admin user: `admin` / `admin123`
- Sample categories and menu items

### Access the App

- **Menu:** http://localhost:8000/menu
- **Admin Login:** http://localhost:8000/login
- **Admin Dashboard:** http://localhost:8000/admin

## Project Structure

```
taco-truck-web-app/
├── app/
│   ├── main.py           # FastAPI application & routes
│   ├── config.py         # Configuration settings
│   ├── database.py       # SQLAlchemy setup
│   ├── models.py         # Database models
│   ├── auth.py           # Authentication utilities
│   ├── templates/
│   │   ├── base.html     # Base template
│   │   ├── menu.html     # Menu page
│   │   ├── cart.html     # Cart page
│   │   ├── login.html    # Admin login
│   │   ├── order_status.html
│   │   └── admin/
│   │       ├── dashboard.html
│   │       ├── menu.html
│   │       └── orders.html
│   └── static/
│       ├── css/custom.css
│       └── js/cart.js
├── requirements.txt
├── .env.example
└── README.md
```

## API Endpoints

### Pages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Redirect to menu |
| GET | `/menu` | Menu page |
| GET | `/cart` | Cart page |
| GET | `/order/{id}` | Order status page |
| GET | `/login` | Admin login page |
| GET | `/admin` | Admin dashboard |
| GET | `/admin/menu` | Menu management |
| GET | `/admin/orders` | Orders list |

### API (HTMX)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/orders/{id}/status` | Update order status |

## Development

### Run in development mode
```bash
python -m app.main
```

### Run with uvicorn directly
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

1. Set `DEBUG=false` in `.env`
2. Use PostgreSQL instead of SQLite
3. Change `SECRET_KEY` to a secure random value
4. Use a production WSGI server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## License

MIT

---

Built with ❤️ for the Mexican food community 🌮
