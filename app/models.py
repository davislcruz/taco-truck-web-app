"""
Database models
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Float, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.CUSTOMER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    orders: Mapped[List["Order"]] = relationship(back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    name_es: Mapped[Optional[str]] = mapped_column(String(100))  # Spanish translation
    description: Mapped[Optional[str]] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    menu_items: Mapped[List["MenuItem"]] = relationship(back_populates="category")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str] = mapped_column(String(100))
    name_es: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    description_es: Mapped[Optional[str]] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float)
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    category: Mapped["Category"] = relationship(back_populates="menu_items")
    options: Mapped[List["MenuItemOption"]] = relationship(back_populates="menu_item")


class OptionType(str, enum.Enum):
    SINGLE = "single"  # Radio button - pick one
    MULTIPLE = "multiple"  # Checkbox - pick multiple


class MenuItemOption(Base):
    __tablename__ = "menu_item_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))
    name: Mapped[str] = mapped_column(String(100))  # e.g., "Meat Choice", "Toppings"
    name_es: Mapped[Optional[str]] = mapped_column(String(100))
    option_type: Mapped[OptionType] = mapped_column(SQLEnum(OptionType), default=OptionType.SINGLE)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    menu_item: Mapped["MenuItem"] = relationship(back_populates="options")
    choices: Mapped[List["OptionChoice"]] = relationship(back_populates="option")


class OptionChoice(Base):
    __tablename__ = "option_choices"

    id: Mapped[int] = mapped_column(primary_key=True)
    option_id: Mapped[int] = mapped_column(ForeignKey("menu_item_options.id"))
    name: Mapped[str] = mapped_column(String(100))  # e.g., "Carne Asada", "Chicken"
    name_es: Mapped[Optional[str]] = mapped_column(String(100))
    price_adjustment: Mapped[float] = mapped_column(Float, default=0.0)  # Extra cost
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    option: Mapped["MenuItemOption"] = relationship(back_populates="choices")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100))
    customer_phone: Mapped[str] = mapped_column(String(20))
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    estimated_time: Mapped[Optional[int]] = mapped_column(Integer)  # minutes
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float)  # Price at time of order
    special_instructions: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    order: Mapped["Order"] = relationship(back_populates="items")
    options: Mapped[List["OrderItemOption"]] = relationship(back_populates="order_item")


class OrderItemOption(Base):
    __tablename__ = "order_item_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))
    option_name: Mapped[str] = mapped_column(String(100))  # Snapshot of option name
    choice_name: Mapped[str] = mapped_column(String(100))  # Snapshot of choice name
    price_adjustment: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationships
    order_item: Mapped["OrderItem"] = relationship(back_populates="options")
