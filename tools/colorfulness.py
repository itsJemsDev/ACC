"""How colourful is the symbol artwork in the mockup vs ours?

AAC boards lean on a distinct, saturated colour per symbol for fast visual
recognition, so a large gap in the colourfulness of the grid region is a real
fidelity signal rather than a rounding difference.
"""
import numpy as np
from PIL import Image


def regions(path):
    im = Image.open(path).convert("RGB")
    return im


def stats(im, box, label):
    a = np.asarray(im.crop(box)).reshape(-1, 3).astype(float) / 255.0
    mx = a.max(axis=1)
    mn = a.min(axis=1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    colourful = sat > 0.35
    # hue in degrees, only for pixels that actually carry chroma
    r, g, b = a[:, 0], a[:, 1], a[:, 2]
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    idx = (mx == r) & nz
    h[idx] = (60 * ((g[idx] - b[idx]) / d[idx])) % 360
    idx = (mx == g) & nz
    h[idx] = 60 * ((b[idx] - r[idx]) / d[idx] + 2)
    idx = (mx == b) & nz
    h[idx] = 60 * ((r[idx] - g[idx]) / d[idx] + 4)
    hue = h[colourful]
    # 12 hue buckets = coarse but enough to see "a rainbow" vs "one colour"
    buckets = np.bincount((hue // 30).astype(int), minlength=12)
    print(f"{label:<26} sat>0.35: {100*colourful.mean():5.2f}%   "
          f"mean sat {sat.mean():.3f}   hue buckets used "
          f"{int((buckets > 0.002*len(hue)).sum())}/12")
    return 100 * colourful.mean(), int((buckets > 0.002 * len(hue)).sum())


if __name__ == "__main__":
    mock = regions("2.png")
    ours = regions("preview/01-board.png")
    print("mock", mock.size, "ours", ours.size)

    # Symbol grid region only. For the mockup use the lower ~55% of the canvas,
    # which is below the phrase strip and prediction bar.
    m = (0, int(mock.size[1] * 0.60), mock.size[0], mock.size[1])
    o = (320, 470, 1835 - 24, 980)
    stats(mock, m, "mockup symbol grid")
    stats(ours, o, "ours symbol grid")
    stats(mock, (0, 0, mock.size[0], mock.size[1]), "mockup WHOLE canvas")
    stats(ours, (0, 0, ours.size[0], ours.size[1]), "ours WHOLE canvas")