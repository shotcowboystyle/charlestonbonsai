# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| makimono (Charleston Bonsai landing, `/`) | Continuous world (worldflight with media-free timing legs; painted DOM planes, no video) | Site bar (wordmark + 5 links) plus an ensō route map: a corner canvas with waypoint ticks and a popover list of 7 kanji waypoints with `aria-current` | Layered sumi-e planes travelling laterally right-to-left (far ridges, mist, cliff pine, near rocks); headline lead-anchored on paper | 7 legs, 1.3/1.3/2.0/**3.1**/2.0/1.3/1.4 = 12.4 + 1 = 13.4vh; one pace; peak = paper veil, silence, WebGL ink bloom into a real catalog photograph | Arrival at a garden gate: the visitor's ensō rises as the moon, a vermilion seal stamps it and is the CTA; the colophon (address, newsletter, legal) lives in the finale | Scroll-velocity ink brush draws a unique ensō (wet when slow, dry kasure when rushed) that is the map, the record, and finally the moon | Sumi-e ink on paper, monochrome plus one vermilion; real catalog photos only at the peak and on hung scrolls | Nuxt dev 3001 / prod preview 4600 |

Shares no columns with an earlier row (first build in this workspace).

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- **makimono:** continuous world built from painted DOM planes over media-free
  worldflight legs; right-to-left lateral travel; a velocity-sensitive brush
  that draws the route map; the "CTA is a seal stamped on what you drew" close;
  a paper veil plus WebGL ink bloom as the peak; 7 legs at 13.4vh.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
