"""Rebuild the local onboarding WebP using Pillow; preserve the original JPEG."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
source = root / "public/images/career-portrait.jpg"
destination = source.with_suffix(".webp")
with Image.open(source) as original:
    image = ImageOps.exif_transpose(original).convert("RGB")
    image.thumbnail((704, 704))
    image.save(destination, "WEBP", quality=88, method=6)
    print(f"{image.width}x{image.height}; {source.stat().st_size} -> {destination.stat().st_size} bytes")
