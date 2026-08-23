#!/usr/bin/env python3
"""Normalise every translucent ground onto the house ladder.

Two faults are corrected:
  1. STRAY INKS   nine near-black navies where the palette names three.
  2. LOOSE ALPHA  the same wash typed at .05 / .055 / .06 / .07 / .08 / .09.

Only values inside background / background-color / background-image
declarations are touched. Nothing else in the file is read or rewritten.
"""
import re, sys, collections

# ── the palette, by its true rgb ─────────────────────────────────────────
OXFORD   = (10, 20, 40)     # --oxford      #0A1428
MIDNIGHT = (14, 27, 51)     # --midnight    #0E1B33
NAVY     = (20, 38, 74)     # --navy        #14264A
WARMWHT  = (255, 252, 240)  # the relief warm white
BRONZE   = (111, 80, 40)    # --bronze      #6F5028

# strays → the named colour they were reaching for
REHOME = {
    (6, 12, 24): OXFORD, (6, 13, 28): OXFORD, (6, 14, 30): OXFORD,
    (4, 10, 24): OXFORD, (3, 8, 20): OXFORD, (0, 0, 0): OXFORD,
    (255, 250, 235): WARMWHT,
    (121, 90, 50): BRONZE,
}

# the alpha ladder, per colour family. Values snap to the nearest rung.
LADDER = {
    (199, 162, 74):  [.06, .12, .18, .25, .35, .45, .50],   # gold
    (231, 201, 122): [.06, .12, .22, .28, .35, .45, .55, .78],  # gold-soft
    (242, 227, 192): [.10, .22, .34, .62, .80, .90],        # champagne
    WARMWHT:         [.05, .10, .16, .38, .55, .72, .95],
    (255, 255, 255): [.05, .14, .35, .45, .55, .72, .95],
    (39, 80, 143):   [.20, .26, .55, .90],                  # sapphire
    (31, 61, 122):   [.10, .34, .42, .50],                  # royal blue
    (30, 106, 79):   [.13, .25],                            # emerald
    (201, 138, 22):  [.13, .20],                            # amber
    (163, 38, 56):   [.10],                                 # oxblood
    BRONZE:          [.08, .12],
    (212, 175, 55):  [.40, .55],                            # gold-rich
    (52, 42, 30):    [.30],
    OXFORD:          [.14, .20, .30, .35, .45, .55, .62, .72, .80, .88, .94],
    MIDNIGHT:        [.14, .20, .30, .35, .45, .55, .62, .72, .80, .88, .94],
    NAVY:            [.06, .08, .14, .20, .30, .35, .45, .55, .62, .72, .80, .88, .94],
}

DECL = re.compile(r'(background(?:-color|-image)?\s*:\s*)([^;}]+)')
RGBA = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)')

def fmt(rgb, a):
    if a is None:
        return 'rgb(%d, %d, %d)' % rgb
    if a == 0:
        s = '0'
    elif a == 1:
        s = '1'
    else:
        s = ('%.2f' % a).lstrip('0').rstrip('0')
        if s == '.':
            s = '0'
    return 'rgba(%d, %d, %d, %s)' % (rgb + (s,))

def convert(m, tally):
    rgb = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    a = float(m.group(4)) if m.group(4) is not None else None
    rgb = REHOME.get(rgb, rgb)
    if a not in (None, 0, 1) and rgb in LADDER:
        a = min(LADDER[rgb], key=lambda r: abs(r - a))
    out = fmt(rgb, a)
    if out != m.group(0):
        tally[(m.group(0), out)] += 1
    return out

def main(paths, write):
    tally = collections.Counter()
    for p in paths:
        src = open(p, encoding='utf-8').read()
        def onDecl(d):
            return d.group(1) + RGBA.sub(lambda m: convert(m, tally), d.group(2))
        out = DECL.sub(onDecl, src)
        if write and out != src:
            open(p, 'w', encoding='utf-8').write(out)
    for (a, b), n in sorted(tally.items(), key=lambda x: -x[1]):
        print('  x%-3d %-34s -> %s' % (n, a, b))
    print('%d declarations rewritten, %d distinct substitutions'
          % (sum(tally.values()), len(tally)))

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--write']
    main(args, '--write' in sys.argv)
