"""Скачивает SVG-иконки из Iconify API для локального использования."""

import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "icons"

# Material Design Icons — Apache 2.0 (https://icon-sets.iconify.design/mdi/)
ICONS = {
    "mdi-cog.svg": "https://api.iconify.design/mdi/cog.svg",
    "mdi-check.svg": "https://api.iconify.design/mdi/check.svg",
    "mdi-lock.svg": "https://api.iconify.design/mdi/lock.svg",
    "mdi-close.svg": "https://api.iconify.design/mdi/close.svg",
    "mdi-menu.svg": "https://api.iconify.design/mdi/menu.svg",
    "mdi-home.svg": "https://api.iconify.design/mdi/home.svg",
    "mdi-book-open-variant.svg": "https://api.iconify.design/mdi/book-open-variant.svg",
    "mdi-volume-high.svg": "https://api.iconify.design/mdi/volume-high.svg",
    "mdi-volume-off.svg": "https://api.iconify.design/mdi/volume-off.svg",
    "mdi-chevron-down.svg": "https://api.iconify.design/mdi/chevron-down.svg",
    "mdi-chevron-right.svg": "https://api.iconify.design/mdi/chevron-right.svg",
}


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    print(f"  OK  {dest.name}")


def main() -> None:
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Icons -> {ICONS_DIR}")
    for filename, url in ICONS.items():
        download(url, ICONS_DIR / filename)
    print("Done.")


if __name__ == "__main__":
    main()
