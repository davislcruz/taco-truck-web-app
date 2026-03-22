"""Generate per-item menu photos from category base images.

We only have one photo per category. For a polished demo, we generate
item-specific crops (unique files) so cards don't look copy-pasted.

- Output: app/static/images/menu/items/{item_id}_{slug}.jpg
- Deterministic crops so reruns are stable.

YAGNI: no ML, no network fetch.
"""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "taco_truck.db"
SRC_DIR = ROOT / "app" / "static" / "images" / "menu"
OUT_DIR = SRC_DIR / "items"


@dataclass(frozen=True)
class Crop:
    left: float
    top: float
    right: float
    bottom: float


CROPS: list[Crop] = [
    Crop(0.00, 0.00, 1.00, 1.00),
    Crop(0.06, 0.00, 0.94, 1.00),
    Crop(0.00, 0.06, 1.00, 0.94),
    Crop(0.07, 0.05, 0.93, 0.95),
    Crop(0.00, 0.10, 1.00, 0.90),
    Crop(0.10, 0.00, 0.90, 1.00),
    Crop(0.12, 0.06, 0.94, 0.94),
    Crop(0.04, 0.12, 0.96, 0.88),
]


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:42] or "item"


def crop_rel(im: Image.Image, crop: Crop) -> Image.Image:
    w, h = im.size
    box = (
        int(w * crop.left),
        int(h * crop.top),
        int(w * crop.right),
        int(h * crop.bottom),
    )
    return im.crop(box)


def main() -> int:
    if not DB_PATH.exists():
        raise SystemExit(f"DB not found: {DB_PATH}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    cat_sources = {
        "tacos": SRC_DIR / "tacos.jpg",
        "burritos": SRC_DIR / "burritos.jpg",
        "tortas": SRC_DIR / "tortas.jpg",
        "drinks": SRC_DIR / "drinks.jpg",
    }

    missing = [k for k, p in cat_sources.items() if not p.exists()]
    if missing:
        raise SystemExit(f"Missing category source images: {', '.join(missing)}")

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    rows = cur.execute(
        """
        select mi.id, c.name as category, mi.name
        from menu_items mi
        join categories c on c.id = mi.category_id
        order by c.display_order, mi.display_order, mi.id
        """
    ).fetchall()

    # Load source images once.
    sources: dict[str, Image.Image] = {}
    for key, path in cat_sources.items():
        im = Image.open(path)
        sources[key] = ImageOps.exif_transpose(im).convert("RGB")

    written = 0
    for idx, (item_id, category_name, item_name) in enumerate(rows):
        key = (category_name or "").strip().lower()
        src = sources.get(key)
        if not src:
            continue

        crop = CROPS[idx % len(CROPS)]
        variant = crop_rel(src, crop)
        variant = ImageOps.fit(variant, (640, 480), method=Image.Resampling.LANCZOS)

        out_name = f"{item_id}_{slugify(item_name)}.jpg"
        out_path = OUT_DIR / out_name

        # idempotent: overwrite (these are generated assets)
        variant.save(out_path, format="JPEG", quality=86, optimize=True, progressive=True)
        written += 1

    # close source images
    for im in sources.values():
        try:
            im.close()
        except Exception:
            pass

    con.close()

    print(f"✅ Wrote {written} item images to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
