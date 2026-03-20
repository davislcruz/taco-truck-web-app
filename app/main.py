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

@app.get("/dev/seed-images", response_class=HTMLResponse)
async def seed_images_only(db: AsyncSession = Depends(get_db)):
    """Assign stock images to existing menu items without reseeding everything."""
    if not DEBUG:
        raise HTTPException(status_code=403, detail="Only available in debug mode")

    image_map = {
        1: [
            "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1565299585323-38174c4a6df1?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1601924638867-3ec2b10f4e97?auto=format&fit=crop&w=1200&q=80"
        ],
        2: [
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=1200&q=80"
        ],
        3: [
            "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=1200&q=80"
        ],
        4: [
            "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80"
        ],
    }

    updated = 0
    for category_id, pool in image_map.items():
        result = await db.execute(select(MenuItem).where(MenuItem.category_id == category_id).order_by(MenuItem.id))
        items = result.scalars().all()
        for idx, item in enumerate(items):
            if item.image_url:
                continue
            item.image_url = pool[idx % len(pool)]
            updated += 1

    if updated:
        await db.commit()

    return f"<h1>✅ Images updated: {updated}</h1><p><a href='/menu'>Go to menu</a></p>"


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
        
        # Ensure core categories exist
        result = await db.execute(select(Category))
        existing_cats = result.scalars().all()

        if existing_cats:
            results.append(f"✅ Categories already exist ({len(existing_cats)} found)")
        else:
            base_categories = [
                Category(name="Tacos", name_es="Tacos", display_order=1),
                Category(name="Burritos", name_es="Burritos", display_order=2),
                Category(name="Tortas", name_es="Tortas", display_order=3),
                Category(name="Drinks", name_es="Bebidas", display_order=4),
            ]
            for cat in base_categories:
                db.add(cat)
            await db.commit()
            results.append("✅ Created 4 categories")

        # Reload categories and map by name
        result = await db.execute(select(Category).order_by(Category.display_order))
        categories = result.scalars().all()
        category_map = {c.name.lower(): c for c in categories}

        sample_images = {
            "tacos": [
                "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1565299585323-38174c4a6df1?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1601924638867-3ec2b10f4e97?auto=format&fit=crop&w=1200&q=80"
            ],
            "burritos": [
                "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=1200&q=80"
            ],
            "tortas": [
                "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=1200&q=80"
            ],
            "drinks": [
                "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80"
            ],
        }

        sample_items_by_category = {
            "tacos": [
                ("Carne Asada Taco", "Taco de Carne Asada", 3.50, "Grilled steak, onion, cilantro"),
                ("Carnitas Taco", "Taco de Carnitas", 3.50, "Slow-cooked pork, salsa verde"),
                ("Chicken Taco", "Taco de Pollo", 3.25, "Marinated chicken, fresh pico"),
                ("Al Pastor Taco", "Taco al Pastor", 3.50, "Pork, pineapple, achiote"),
                ("Barbacoa Taco", "Taco de Barbacoa", 3.75, "Tender beef, guajillo broth"),
                ("Birria Taco", "Taco de Birria", 4.25, "Quesabirria with consomé"),
                ("Fish Taco", "Taco de Pescado", 3.95, "Crispy fish, lime crema"),
                ("Shrimp Taco", "Taco de Camarón", 4.25, "Garlic shrimp, slaw"),
            ],
            "burritos": [
                ("Carne Asada Burrito", "Burrito de Carne Asada", 9.99, "Steak, beans, rice, salsa"),
                ("Chicken Burrito", "Burrito de Pollo", 9.50, "Chicken, beans, rice, crema"),
                ("Al Pastor Burrito", "Burrito al Pastor", 9.95, "Pork, pineapple, rice"),
                ("Veggie Burrito", "Burrito Vegetariano", 8.95, "Fajita veggies, guac"),
                ("Chile Verde Burrito", "Burrito Chile Verde", 10.25, "Pork in green chile sauce"),
                ("Birria Burrito", "Burrito de Birria", 10.75, "Birria beef, cheese"),
            ],
            "tortas": [
                ("Carne Asada Torta", "Torta de Carne Asada", 8.99, "Telera roll, steak, avocado"),
                ("Milanesa Torta", "Torta de Milanesa", 8.95, "Breaded chicken cutlet"),
                ("Cubana Torta", "Torta Cubana", 10.50, "Mixed meats, jalapeño"),
                ("Al Pastor Torta", "Torta al Pastor", 9.25, "Pastor, beans, lettuce"),
                ("Veggie Torta", "Torta Vegetariana", 8.50, "Grilled veggies, cheese"),
            ],
            "drinks": [
                ("Horchata", "Horchata", 3.00, "Rice-cinnamon agua fresca"),
                ("Mexican Coke", "Coca Mexicana", 2.50, "Glass bottle"),
                ("Jamaica", "Agua de Jamaica", 3.00, "Hibiscus agua fresca"),
                ("Tamarindo", "Agua de Tamarindo", 3.00, "Tamarind agua fresca"),
                ("Lime Agua Fresca", "Agua de Limón", 3.00, "Fresh lime drink"),
                ("Jarritos Mandarin", "Jarritos Mandarina", 2.75, "Mandarin soda"),
            ],
        }

        created_count = 0
        for cat_key, items in sample_items_by_category.items():
            category = category_map.get(cat_key)
            if not category:
                continue

            item_result = await db.execute(select(MenuItem).where(MenuItem.category_id == category.id))
            existing_names = {i.name for i in item_result.scalars().all()}

            display_order = 1
            for name, name_es, price, desc in items:
                if name in existing_names:
                    continue
                image_candidates = sample_images.get(cat_key, [])
                image_url = image_candidates[(display_order - 1) % len(image_candidates)] if image_candidates else None
                db.add(
                    MenuItem(
                        category_id=category.id,
                        name=name,
                        name_es=name_es,
                        price=price,
                        description=desc,
                        image_url=image_url,
                        display_order=display_order,
                        is_available=True,
                    )
                )
                display_order += 1
                created_count += 1

        if created_count > 0:
            await db.commit()
            results.append(f"✅ Added {created_count} new menu items")
        else:
            results.append("✅ Menu already has rich sample items")

        # Assign images to existing items that don't have one yet
        image_updates = 0
        for cat_key, image_pool in sample_images.items():
            category = category_map.get(cat_key)
            if not category or not image_pool:
                continue
            item_result = await db.execute(select(MenuItem).where(MenuItem.category_id == category.id).order_by(MenuItem.id))
            existing_items = item_result.scalars().all()
            for idx, item in enumerate(existing_items):
                if item.image_url:
                    continue
                item.image_url = image_pool[idx % len(image_pool)]
                image_updates += 1

        if image_updates > 0:
            await db.commit()
            results.append(f"✅ Assigned stock images to {image_updates} items")
        else:
            results.append("✅ Stock images already assigned")
        
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
