"""Compare the dominant palette of the mockups against the rendered build.

We cannot view the images, so fidelity is argued from the numbers: the mockup's
top colours (by pixel share) must all still be present in our render, and no
colour of ours may dominate that the mockup does not use.
"""
import sys
from collections import Counter

import numpy as np
from PIL import Image


def palette(path, top=14, quant=3):
    im = Image.open(path).convert("RGB").resize((520, 340), Image.LANCZOS)
    a = np.asarray(im).reshape(-1, 3)
    q = (a // (256 // quant)).astype(int)
    keys = q[:, 0] * quant * quant + q[:, 1] * quant + q[:, 2]
    counts = Counter(keys.tolist())
    total = keys.size
    out = []
    for k, c in counts.most_common(top):
        sel = keys == k
        mean = a[sel].mean(axis=0).round().astype(int)
        out.append((tuple(mean), 100.0 * c / total))
    return out


def near(rgb, ref, tol=14):
    return sum(abs(int(a) - int(b)) for a, b in zip(rgb, ref)) <= tol


def report(name, ref_path, ours_path):
    ref = palette(ref_path)
    ours = palette(ours_path)
    print(f"\n=== {name}: {ref_path} vs {ours_path} ===")
    print(f"{'mock colour':<18}{'share':>7}   {'ours':<18}{'share':>7}   match")
    matched = set()
    for rgb, pct in ref:
        hit = None
        for i, (o, op) in enumerate(ours):
            if i in matched:
                continue
            if near(o, rgb):
                hit = (i, o, op)
                break
        if hit:
            matched.add(hit[0])
            print(f"{'#%02X%02X%02X' % rgb:<18}{pct:6.1f}%   "
                  f"{'#%02X%02X%02X' % hit[1]:<18}{hit[2]:6.1f}%   yes")
        else:
            best = min(ours, key=lambda x: sum(abs(int(a) - int(b)) for a, b in zip(x[0], rgb)))
            print(f"{'#%02X%02X%02X' % rgb:<18}{pct:6.1f}%   "
                  f"{'#%02X%02X%02X' % best[0]:<18}{best[1]:6.1f}%   NO "
                  f"(d={sum(abs(int(a) - int(b)) for a, b in zip(best[0], rgb))})")
    return ref, ours


if __name__ == "__main__":
    ref2, our2 = report("communication board", "2.png", "preview/01-board.png")
    report("caregiver portal", "1.png", "preview/10-portal-dashboard.png")