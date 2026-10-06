#!/usr/bin/env python3
"""Chroma-key magenta sprites, trim, and export transparent PNGs."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace")
ART = ROOT / "artifacts" / "imagine_images"
OUT = ROOT / "public" / "sprites"


def key_magenta(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mag_chroma = (r + b) * 0.5 - g
    balance = 1.0 - np.abs(r - b) / 255.0
    score = (mag_chroma / 255.0) * np.clip(balance, 0.35, 1.0)
    # Soft matte: pure-ish magenta → 0, mixed edge → partial
    alpha = np.clip((0.52 - score) / 0.30, 0.0, 1.0)
    alpha = np.where(score > 0.48, 0.0, alpha)
    # Kill leftover screen in near-transparent pixels
    alpha = np.where(alpha < 0.08, 0.0, alpha)
    spill = np.clip((score - 0.10) / 0.40, 0.0, 1.0) * (1.0 - alpha)
    arr[..., 0] = np.clip(r - spill * 55, 0, 255)
    arr[..., 1] = np.clip(g + spill * 18, 0, 255)
    arr[..., 2] = np.clip(b - spill * 55, 0, 255)
    arr[..., 3] = np.clip(alpha * 255.0, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def trim(im: Image.Image, pad_ratio: float = 0.06, min_pad: int = 12) -> Image.Image:
    alpha = np.asarray(im.split()[-1])
    ys, xs = np.where(alpha > 12)
    if len(xs) == 0:
        return im
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    w, h = x1 - x0, y1 - y0
    pad = max(min_pad, int(max(w, h) * pad_ratio))
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def fit_square(im: Image.Image, size: int, bottom_align: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min(size / im.width, size / im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = size - nh if bottom_align else (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def export_sprite(src: Path, dest: Path, size: int, bottom_align: bool = False, pad: float = 0.06) -> None:
    im = Image.open(src)
    keyed = key_magenta(im)
    trimmed = trim(keyed, pad_ratio=pad)
    out = fit_square(trimmed, size, bottom_align=bottom_align)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "PNG", optimize=True)
    print(f"sprite {dest.name} {out.size} from {src.name}")


def export_bg(src: Path, dest: Path, size: tuple[int, int] = (720, 1280)) -> None:
    im = Image.open(src).convert("RGB")
    im = im.resize(size, Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=86, optimize=True)
    print(f"bg {dest.name} {im.size}")


SPRITES = [
    # characters — bottom aligned so idle/throw share a ground line
    ("e47f5fe5-cccb-49dc-9ffd-77d1133bfbbe.jpg", "stan/idle.png", 768, True, 0.08),
    ("73192fc8-f86e-4beb-bf7c-3d54cad8eab6.jpg", "stan/throw.png", 768, True, 0.08),
    ("ad6392ab-a174-4fc5-82e0-a74857b499ff.jpg", "stan/follow.png", 768, True, 0.08),
    ("d030a7db-0471-4ec8-85eb-050ade2187d5.jpg", "nova/idle.png", 768, True, 0.08),
    ("fb411c90-aef7-4714-842b-3e0aa238d3bd.jpg", "nova/point.png", 768, True, 0.08),
    ("8b1c1b6a-ce4c-4852-842c-5e742b6d43d0.jpg", "nova/cheer.png", 768, True, 0.08),
    # items
    ("645bd119-e804-461e-b494-563d83c16f43.jpg", "items/heart.png", 384, False, 0.08),
    ("6e8d245b-df70-45ec-a317-65b1dc2d09b3.jpg", "items/star.png", 384, False, 0.08),
    ("a4fad20a-caf8-443b-a3f7-ff0ff356d632.jpg", "items/gem.png", 384, False, 0.08),
    ("7da0527e-cb49-4ee5-b648-4c3e0a1d5a82.jpg", "items/note.png", 384, False, 0.08),
    ("6429a8b5-0ea3-4c91-bf4f-9dddd165c0d8.jpg", "items/coin.png", 384, False, 0.08),
    ("29c1cb11-1952-4851-9646-05be6378f079.jpg", "items/rainbow.png", 384, False, 0.08),
    ("f74a88e6-d00e-4ed7-89fa-2b7576b51e53.jpg", "items/lantern.png", 384, False, 0.08),
    ("5c824e1a-9425-4b24-9a81-ee7df9a049e8.jpg", "items/gift.png", 384, False, 0.08),
    ("6a9ec30f-1972-416a-9707-ba45a786d063.jpg", "items/magnet.png", 384, False, 0.08),
    ("c3cf0515-2fda-41d1-b83f-cf1823724a16.jpg", "items/pulse.png", 512, False, 0.04),
    ("fb1dc6ff-3afd-4521-be7d-0cbb33773b30.jpg", "fx/petal.png", 256, False, 0.12),
    # family
    ("168c9d29-4fb4-4e55-b940-409992f112a3.jpg", "family/annie.png", 384, False, 0.04),
    ("ccdc8212-0712-499d-b674-3b82d1bbf493.jpg", "family/michael.png", 384, False, 0.04),
    ("a3fbd82d-91fe-49c2-a134-f0f347518f02.jpg", "family/grandma.png", 384, False, 0.04),
    ("7eab3931-bd2c-4400-baea-af36e20f9841.jpg", "family/kelly.png", 384, False, 0.04),
]

BGS = [
    ("f1a396de-96c1-48a6-a150-77c2f40fdd11.jpg", "bg/level-1.jpg"),
    ("e0c6d6f8-298d-4f66-b135-674dd7cdc13e.jpg", "bg/level-2.jpg"),
    ("3635c721-20f5-4dad-bee1-a4b991a84bf5.jpg", "bg/level-3.jpg"),
    ("4718e852-b89d-4fc0-8dd9-e59c94e5c890.jpg", "bg/level-4.jpg"),
    ("f4df0b10-9a7c-4e26-8cc3-62d223c15e17.jpg", "bg/level-5.jpg"),
    ("5320df15-c479-482e-8023-738c1dc2c257.jpg", "bg/level-6.jpg"),
]


def main() -> None:
    for src_name, dest_rel, size, bottom, pad in SPRITES:
        export_sprite(ART / src_name, OUT / dest_rel, size, bottom_align=bottom, pad=pad)
    for src_name, dest_rel in BGS:
        export_bg(ART / src_name, OUT / dest_rel)
    print("done")


if __name__ == "__main__":
    main()
