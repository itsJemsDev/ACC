"""Extract the symbol-grid card boxes and each card's dominant artwork colour
from the 2.png mockup, so our artwork palette can be compared cell by cell.
"""
import numpy as np
from PIL import Image

im = Image.open("2.png").convert("RGB")
W, H = im.size
a = np.asarray(im).astype(int)

# Canvas is ~#F8FAFC; cards are white. Flood-fill style detection: rows/cols
# that are almost entirely white mark card interiors.
white = (a[:, :, 0] > 250) & (a[:, :, 1] > 250) & (a[:, :, 2] > 250)


def runs(mask):
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(mask)))
    return [r for r in out if r[1] - r[0] > 40]


rows = runs(white.mean(axis=1) > 0.35)
print("canvas", im.size, "| white row bands:", len(rows))
for r in rows:
    band = white[r[0]:r[1]]
    cols = runs(band.mean(axis=0) > 0.55)
    print(f"  rows {r[0]:4d}-{r[1]:4d} ({r[1]-r[0]:3d}px) -> {len(cols)} columns:",
          [(c[0], c[1]) for c in cols][:6])