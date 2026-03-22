"""Apply content polish updates to the dev SQLite DB.

Phase 1 goals:
- Fill missing/placeholder-y descriptions with real, unique short descriptions.
- Point each item at its own generated photo under /static/images/menu/items/.

Idempotent:
- Safe to run multiple times.

NOTE: This updates taco_truck.db directly (dev). Production should use migrations/admin.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "taco_truck.db"


DESC_BY_NAME: dict[str, str] = {
    # Tacos
    "Carne Asada Taco": "Char-grilled steak, onion, cilantro, and lime.",
    "Carnitas Taco": "Slow-braised pork with salsa verde and fresh onion.",
    "Chicken Taco": "Citrus-marinated chicken, pico de gallo, and crema.",
    "Al Pastor Taco": "Achiote pork, pineapple, and a bright cilantro finish.",

    # Burritos
    "Carne Asada Burrito": "Steak, rice, beans, salsa roja, and cheese in a warm tortilla.",
    "Chicken Burrito": "Chicken, rice, beans, pico, and crema - built to satisfy.",

    # Tortas
    "Carne Asada Torta": "Toasted telera, steak, avocado, beans, and chipotle mayo.",

    # Drinks
    "Horchata": "House-made rice & cinnamon agua fresca, served over ice.",
    "Mexican Coke": "Classic glass-bottle cola with real cane sugar.",
}


def main() -> int:
    if not DB_PATH.exists():
        raise SystemExit(f"DB not found: {DB_PATH}")

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Update descriptions if missing/null.
    updated_desc = 0
    for name, desc in DESC_BY_NAME.items():
        cur.execute(
            """
            update menu_items
            set description = ?
            where name = ?
              and (description is null or trim(description) = '')
            """,
            (desc, name),
        )
        updated_desc += cur.rowcount

    # Update image urls to per-item generated images.
    # We assume scripts/generate_item_photos.py has run.
    rows = cur.execute("select id, name from menu_items").fetchall()
    updated_img = 0
    for item_id, name in rows:
        # match the generator naming
        import re

        def slugify(text: str) -> str:
            text = text.strip().lower()
            text = re.sub(r"[^a-z0-9]+", "-", text)
            return text.strip("-")[:42] or "item"

        url = f"/static/images/menu/items/{item_id}_{slugify(name)}.jpg"
        cur.execute("update menu_items set image_url = ? where id = ?", (url, item_id))
        updated_img += cur.rowcount

    con.commit()
    con.close()

    print(f"						")
    print(f"						")
    print(f"						")
    print(f"✅ Updated descriptions: {updated_desc}")
    print(f"✅ Updated image_url for items: {updated_img}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
