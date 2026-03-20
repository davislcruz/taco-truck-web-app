"""
Taco Truck Web App - Main Application
FastAPI + Jinja2 + HTMX + Tailwind (CDN)
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Depends, Form, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.config import APP_NAME, DEBUG
from app.database import init_db, get_db
from app.models import User, UserRole, Category, MenuItem, Order, OrderStatus, OrderItem
from app.auth import verify_password, create_session_token, decode_session_token

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print("🌮 Taco Truck database initialized!")
    yield
    # Shutdown
    pass


# Create app
app = FastAPI(title=APP_NAME, lifespan=lifespan, debug=DEBUG)

# Paths
BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Templates
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


# =============================================================================
# TEMPLATE HELPERS
# =============================================================================

def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from session cookie"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        return None
    
    payload = decode_session_token(session_token)
    if not payload:
        return None
    
    return {
        "id": int(payload["sub"]),
        "role": payload["role"]
    }


def is_admin(user: Optional[dict]) -> bool:
    """Check if user is admin"""
    return user and user.get("role") == UserRole.ADMIN.value


def require_admin_or_redirect(request: Request):
    """Return redirect response if not admin, else None."""
    user = get_current_user(request)
    if not is_admin(user):
        return RedirectResponse(url="/login", status_code=302)
    return None


# =============================================================================
# TEMPLATE FILTERS
# =============================================================================

def currency(value):
    """Format as currency"""
    return f"${value:.2f}"

templates.env.filters["currency"] = currency


# =============================================================================
# CONTEXT PROCESSOR
# =============================================================================

async def get_template_context(request: Request) -> dict:
    """Get common template context"""
    user = get_current_user(request)
    return {
        "request": request,
        "app_name": APP_NAME,
        "current_user": user,
        "is_admin": is_admin(user)
    }


# =============================================================================
# ROUTES - Pages
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page - redirect to menu"""
    return RedirectResponse(url="/menu")


@app.get("/menu", response_class=HTMLResponse)
async def menu_page(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Menu page - show all categories and items"""
    # Get categories with items
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.display_order)
    )
    categories = result.scalars().all()
    
    # Get menu items for each category
    items_by_category = {}
    for cat in categories:
        result = await db.execute(
            select(MenuItem)
            .where(MenuItem.category_id == cat.id, MenuItem.is_available == True)
            .order_by(MenuItem.display_order)
        )
        items_by_category[cat.id] = result.scalars().all()
    
    ctx = await get_template_context(request)
    return templates.TemplateResponse(
        "menu.html",
        {**ctx, "categories": categories, "items_by_category": items_by_category}
    )


@app.get("/cart", response_class=HTMLResponse)
async def cart_page(request: Request):
    """Cart page"""
    ctx = await get_template_context(request)
    return templates.TemplateResponse("cart.html", ctx)


@app.get("/order/{order_id}", response_class=HTMLResponse)
async def order_status_page(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Order status/tracking page"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    ctx = await get_template_context(request)
    return templates.TemplateResponse("order_status.html", {**ctx, "order": order})


# =============================================================================
# ROUTES - Auth
# =============================================================================

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Login page"""
    ctx = await get_template_context(request)
    return templates.TemplateResponse("login.html", ctx)


@app.post("/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Process login"""
    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.password_hash):
        ctx = await get_template_context(request)
        return templates.TemplateResponse(
            "login.html",
            {**ctx, "error": "Invalid username or password"}
        )
    
    if not user.is_active:
        ctx = await get_template_context(request)
        return templates.TemplateResponse(
            "login.html",
            {**ctx, "error": "Account is disabled"}
        )
    
    # Create session
    token = create_session_token(user.id, user.role.value)
    
    response = RedirectResponse(url="/admin", status_code=302)
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,  # 7 days
        samesite="lax"
    )
    return response


@app.get("/logout")
async def logout():
    """Logout"""
    response = RedirectResponse(url="/menu", status_code=302)
    response.delete_cookie("session_token")
    return response


# =============================================================================
# ROUTES - Admin
# =============================================================================

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Admin dashboard"""
    user = get_current_user(request)
    if not is_admin(user):
        return RedirectResponse(url="/login", status_code=302)
    
    # Get orders
    result = await db.execute(
        select(Order)
        .where(Order.status != OrderStatus.COMPLETED)
        .where(Order.status != OrderStatus.CANCELLED)
        .order_by(Order.created_at.desc())
    )
    active_orders = result.scalars().all()
    
    ctx = await get_template_context(request)
    return templates.TemplateResponse(
        "admin/dashboard.html",
        {**ctx, "active_orders": active_orders}
    )


@app.get("/admin/menu", response_class=HTMLResponse)
async def admin_menu(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Admin menu management"""
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(Category).order_by(Category.display_order))
    categories = result.scalars().all()

    items_by_category = {}
    for category in categories:
        item_result = await db.execute(
            select(MenuItem).where(MenuItem.category_id == category.id).order_by(MenuItem.display_order)
        )
        items_by_category[category.id] = item_result.scalars().all()

    ctx = await get_template_context(request)
    return templates.TemplateResponse(
        "admin/menu.html",
        {**ctx, "categories": categories, "items_by_category": items_by_category}
    )


@app.get("/admin/orders", response_class=HTMLResponse)
async def admin_orders(
    request: Request,
    search: str = "",
    status: str = "",
    db: AsyncSession = Depends(get_db)
):
    """Admin orders list with basic filters."""
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    query = select(Order)

    if search:
        query = query.where(Order.customer_phone.contains(search))

    if status:
        try:
            query = query.where(Order.status == OrderStatus(status))
        except ValueError:
            pass

    query = query.order_by(Order.created_at.desc()).limit(100)
    result = await db.execute(query)
    orders = result.scalars().all()

    ctx = await get_template_context(request)
    return templates.TemplateResponse(
        "admin/orders.html",
        {**ctx, "orders": orders, "search": search, "status_filter": status}
    )


@app.get("/admin/settings", response_class=HTMLResponse)
async def admin_settings(request: Request):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect
    ctx = await get_template_context(request)
    return templates.TemplateResponse("admin/settings.html", ctx)


@app.get("/admin/orders/{order_id}", response_class=HTMLResponse)
async def admin_order_detail(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    ctx = await get_template_context(request)
    return templates.TemplateResponse("admin/order_detail.html", {**ctx, "order": order})


@app.post("/admin/orders/{order_id}/status")
async def admin_update_order_status(
    request: Request,
    order_id: int,
    status: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        order.status = OrderStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    await db.commit()
    return RedirectResponse(url=request.headers.get("referer", "/admin/orders"), status_code=302)


@app.get("/admin/menu/new-category")
async def admin_new_category_redirect(request: Request):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect
    return RedirectResponse(url="/admin/menu", status_code=302)


@app.post("/admin/menu/new-category")
async def admin_create_category(
    request: Request,
    name: str = Form(...),
    name_es: str = Form(default=""),
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(Category).order_by(Category.display_order.desc()))
    last = result.scalars().first()
    next_order = (last.display_order + 1) if last else 1

    db.add(Category(name=name.strip(), name_es=(name_es.strip() or None), display_order=next_order))
    await db.commit()
    return RedirectResponse(url="/admin/menu", status_code=302)


@app.get("/admin/menu/new-item")
async def admin_new_item_redirect(request: Request):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect
    return RedirectResponse(url="/admin/menu", status_code=302)


@app.post("/admin/menu/new-item")
async def admin_create_item(
    request: Request,
    category_id: int = Form(...),
    name: str = Form(...),
    price: float = Form(...),
    name_es: str = Form(default=""),
    description: str = Form(default=""),
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(
        select(MenuItem).where(MenuItem.category_id == category_id).order_by(MenuItem.display_order.desc())
    )
    last = result.scalars().first()
    next_order = (last.display_order + 1) if last else 1

    db.add(
        MenuItem(
            category_id=category_id,
            name=name.strip(),
            name_es=(name_es.strip() or None),
            description=(description.strip() or None),
            price=price,
            display_order=next_order,
            is_available=True,
        )
    )
    await db.commit()
    return RedirectResponse(url="/admin/menu", status_code=302)


@app.get("/admin/menu/{item_id}/edit", response_class=HTMLResponse)
async def admin_edit_item_view(
    request: Request,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    ctx = await get_template_context(request)
    return templates.TemplateResponse("admin/edit_item.html", {**ctx, "item": item})


@app.post("/admin/menu/{item_id}/edit")
async def admin_edit_item_submit(
    request: Request,
    item_id: int,
    name: str = Form(...),
    price: float = Form(...),
    name_es: str = Form(default=""),
    description: str = Form(default=""),
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.name = name.strip()
    item.price = price
    item.name_es = name_es.strip() or None
    item.description = description.strip() or None
    await db.commit()
    return RedirectResponse(url="/admin/menu", status_code=302)


@app.post("/admin/menu/{item_id}/toggle")
async def admin_toggle_item(
    request: Request,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_available = not item.is_available
    await db.commit()
    return RedirectResponse(url="/admin/menu", status_code=302)


@app.post("/admin/menu/{item_id}/delete")
async def admin_delete_item(
    request: Request,
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    redirect = require_admin_or_redirect(request)
    if redirect:
        return redirect

    await db.execute(delete(MenuItem).where(MenuItem.id == item_id))
    await db.commit()
    return RedirectResponse(url="/admin/menu", status_code=302)


# =============================================================================
# ROUTES - API (for HTMX)
# =============================================================================

@app.post("/api/cart/add", response_class=HTMLResponse)
async def add_to_cart(
    request: Request,
    item_id: int = Form(...),
    quantity: int = Form(default=1),
    db: AsyncSession = Depends(get_db)
):
    """Add item to cart (returns cart partial)"""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    ctx = await get_template_context(request)
    return templates.TemplateResponse(
        "partials/cart_item.html",
        {**ctx, "item": item, "quantity": quantity}
    )


@app.put("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Update order status"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        order.status = OrderStatus(status)
        await db.commit()
        return {"success": True, "status": status}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")


# =============================================================================
# DEV ROUTE - Seed database
# =============================================================================

@app.get("/dev/seed", response_class=HTMLResponse)
@app.post("/dev/seed", response_class=HTMLResponse)
async def seed_database(db: AsyncSession = Depends(get_db)):
    """Seed database with sample data (dev only)"""
    if not DEBUG:
        raise HTTPException(status_code=403, detail="Only available in debug mode")
    
    from app.auth import hash_password
    
    results = []
    
    try:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.username == "admin"))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            results.append("✅ Admin user already exists")
        else:
            # Create admin user
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN
            )
            db.add(admin)
            await db.commit()
            results.append("✅ Created admin user (admin / admin123)")
        
        # Check if categories exist
        result = await db.execute(select(Category))
        existing_cats = result.scalars().all()
        
        if existing_cats:
            results.append(f"✅ Categories already exist ({len(existing_cats)} found)")
        else:
            # Create categories
            categories = [
                Category(name="Tacos", name_es="Tacos", display_order=1),
                Category(name="Burritos", name_es="Burritos", display_order=2),
                Category(name="Tortas", name_es="Tortas", display_order=3),
                Category(name="Drinks", name_es="Bebidas", display_order=4),
            ]
            for cat in categories:
                db.add(cat)
            await db.commit()
            results.append("✅ Created 4 categories")
            
            # Refresh to get IDs
            for cat in categories:
                await db.refresh(cat)
            
            # Create menu items
            items = [
                MenuItem(category_id=categories[0].id, name="Carne Asada Taco", name_es="Taco de Carne Asada", price=3.50),
                MenuItem(category_id=categories[0].id, name="Carnitas Taco", name_es="Taco de Carnitas", price=3.50),
                MenuItem(category_id=categories[0].id, name="Chicken Taco", name_es="Taco de Pollo", price=3.25),
                MenuItem(category_id=categories[0].id, name="Al Pastor Taco", name_es="Taco al Pastor", price=3.50),
                MenuItem(category_id=categories[1].id, name="Carne Asada Burrito", name_es="Burrito de Carne Asada", price=9.99),
                MenuItem(category_id=categories[1].id, name="Chicken Burrito", name_es="Burrito de Pollo", price=9.50),
                MenuItem(category_id=categories[2].id, name="Carne Asada Torta", name_es="Torta de Carne Asada", price=8.99),
                MenuItem(category_id=categories[3].id, name="Horchata", name_es="Horchata", price=3.00),
                MenuItem(category_id=categories[3].id, name="Mexican Coke", name_es="Coca Mexicana", price=2.50),
            ]
            for item in items:
                db.add(item)
            await db.commit()
            results.append("✅ Created 9 menu items")
        
        return f"""<!DOCTYPE html>
<html>
<head><title>Seed Results</title>
<style>body {{ font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }}</style>
</head>
<body>
<h1>🌮 Database Seed Results</h1>
<pre>{chr(10).join(results)}</pre>
<p><a href="/login">→ Go to Login</a></p>
</body>
</html>"""
        
    except Exception as e:
        return f"""<!DOCTYPE html>
<html>
<head><title>Seed Error</title></head>
<body>
<h1>❌ Seed Failed</h1>
<pre>{str(e)}</pre>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
