"""Скачивает шрифты проекта для локального использования."""

import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONTS_DIR = ROOT / "fonts"
CSS_OUT = ROOT / "css" / "fonts.css"

SOURCES = {
    "rubik-variable.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/Rubik%5Bwght%5D.ttf",
    "montserrat-variable.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf",
    "playfair-display-variable.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf",
    "OFL.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt",
}


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        dest.write_bytes(resp.read())


def main() -> None:
    FONTS_DIR.mkdir(exist_ok=True)

    for filename, url in SOURCES.items():
        dest = FONTS_DIR / filename
        download(url, dest)
        print(f"saved {filename} ({dest.stat().st_size} bytes)")

    css = """\
/* Локальные шрифты — SIL Open Font License 1.1 (Google Fonts) */

@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 300 900;
  src: url("../fonts/rubik-variable.ttf") format("truetype");
  font-display: swap;
}

@font-face {
  font-family: "Montserrat";
  font-style: normal;
  font-weight: 100 900;
  src: url("../fonts/montserrat-variable.ttf") format("truetype");
  font-display: swap;
}

@font-face {
  font-family: "Playfair Display";
  font-style: normal;
  font-weight: 400 900;
  src: url("../fonts/playfair-display-variable.ttf") format("truetype");
  font-display: swap;
}
"""

    CSS_OUT.write_text(css, encoding="utf-8")
    print(f"wrote {CSS_OUT}")


if __name__ == "__main__":
    main()
