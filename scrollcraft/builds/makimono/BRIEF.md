# BRIEF: Charleston Bonsai, landing page ("makimono")

Interviewed 2026-10-07. The user accepted the proposed default for questions 1–6
("default") and answered 7 and 8 in their own words. The defaults were written by
the agent and approved by the user, so they are recorded as the approved answers.

Original ask (verbatim): "Redesign the landing page. It should be a japanese sumi-e
style premium awwwards scroll driven story telling page. It should be premium
artistic page that promotes an artist's shop, art and expertise."

## The eight answers

1. **Vibe.** Ink, silence, patience, the hand. References: Hasegawa Tōhaku's
   *Pine Trees* screen (pines dissolving into mist), Ozu's still "pillow shots",
   Kenya Hara's *White*. (approved default)
2. **Journey.** Blank paper and a brushstroke into a tree, then the hand (wiring,
   waiting, years compressed), then the seasons (what a tree costs in time), then
   the art (live specimens from the catalog, the shop), then the teaching
   (retreats, events, the expertise), then the close (visit or inquire).
   (approved default)
3. **Energy.** Very quiet open, rising through the process, peak at the bloom,
   calm through the catalog, a still close. (approved default)
4. **Feeling, and the one moment.** Stillness, curiosity, reverence, desire,
   trust, resolve. The moment: *"the ink bled across the paper and became a tree
   I could actually buy."* (approved default)
5. **The thing no other site does.** The scroll is the brush. Scrolling draws a
   single ensō: fast scrolling runs the brush dry and it breaks into streaks,
   slow scrolling lets the ink pool. At the end the circle closes and the
   artist's red seal stamps it, and the seal is the call to action. Every
   visitor's circle is different. (approved default)
6. **Range.** Editorial and minimal on a light paper ground. Real ink blacks, one
   vermilion seal colour and nothing else. (approved default)
7. **One world or scenes.** User: **"B"**, one continuous world: a horizontal
   handscroll (emakimono) the visitor travels through.
8. **Assets.** User: "there are more specimen photos. Ideally they can be easily
   swapped in/out. you can say approximately 200 trees in the nursery. years
   practicing = over 20 years."

Build location (user): "replace current `pages/index.vue`". Spend (user): "spend
is fine, can be higher if necessary".

## Facts allowed on the page

- Over twenty years practising. Around two hundred trees in the nursery.
  (user-supplied; no other numbers)
- From the existing site: visits by appointment, Tuesday through Saturday, 943
  Godber Street, Charleston, SC 29412. Retreats in the Blue Ridge, one tree per
  guest, worked across the visit and carried home. Event arrangements across the
  Lowcountry. Price on inquiry. Wiring in late winter, copper and annealed
  aluminum. Soil of akadama, pumice and lava, blended by species. Repotting
  follows the species, not the calendar. "A branch removed in October is settled
  by April." Trees are sold "when they are finished enough to leave."
- Specimen facts come from the live catalog (`/api/trees/featured`) only. The
  owner swaps specimens by toggling *featured* in the admin dashboard. With no
  catalog data the page falls back to the owner's own photo of a real tree
  (`retreat-individual-tree-1.jpeg`) and names no specifics.

## One action

**Arrange a visit** → `/visit`. One label, used everywhere on the page.

## The grammar

Continuous world (uniqueness.md §2.4), built in worldflight mode. One fixed
stage, one spacer, nothing else in document flow. The nav is a **map** (the
ensō, with clickable waypoints). The hero is an establishing position inside
the world. The close is arrival at a place in the same canvas, with the CTA as
an object in it: the artist's seal stamped at the end of the scroll, the way a
painter seals a finished handscroll.

## The world

An ink handscroll that reads **right to left**, like a real emakimono: as you
scroll, the painting moves to the right and new scenes unroll in from the left.
Built as painted planes (far washes, mist veils, mid scenes, near dark
foreground) that move at different rates. Ink on paper, monochrome. The only
colour is the vermilion seal and the real photographs of real trees.

## Journey, waypoints, and feeling curve

Written before the score. One line per leg: the feeling, then what causes it.

| # | Waypoint | Feeling | What causes it |
|---|---|---|---|
| 1 | 山 Mountain | **Stillness** | Mist, far ridges, one wind-shaped pine on a cliff. Almost nothing moves until the hand does. |
| 2 | 手 The hand | **Curiosity** | Hands wiring a branch arrive out of the mist. Copy names the patience plainly. |
| 3 | 四季 Seasons | **Reverence** | The same tree passes four times, spring to snow, under the reader's own hand. Time made visible. |
| 4 | 墨 Ink | **Awe, then desire** (peak) | Authored silence: blank paper. A drop. Ink blooms outward and the bloom becomes a painted tree, then the painting bleeds into a photograph of a real specimen you can buy. |
| 5 | 庭 The nursery | **Desire settling into trust** | Live oaks and Spanish moss, benches of trees. Real specimens hang like scrolls, labelled with facts, not pitch. |
| 6 | 学 The bench | **Belonging** | People at a mountain bench. Retreats and events: you can learn this here. |
| 7 | 印 The seal | **Resolve** | Your ensō closes and rises over the nursery gate like a moon; the red seal stamps it. Arrange a visit. |

No two adjacent legs share a feeling.

## The peak

> "the page went completely blank, a drop of ink hit it, and the ink spread into
> a tree, and then the tree turned out to be a real one I can go and buy"

Lives in leg 4 (墨 Ink). It gets the largest span on the page, the only custom
WebGL on the page, and the silence in front of it.

## Authored silence

The first ~25% of leg 4 is deliberately blank paper with no copy. It is the
silence before the peak, **not dead scroll**. The world still travels (paper
fibre and mist drift), but nothing on it is meant to be read.

## Tell-someone sentence

> It's the site where **your scrolling is an ink brush: it paints a circle as you
> travel, a drop of the ink blooms into a real tree you can buy, and at the end
> the artist seals the circle you drew.**

## Signature move

**The visitor's own ensō.** A brush simulation drawn on a canvas by scroll:
scroll velocity sets pressure and dryness (slow = wide, wet, pooling; fast =
thin, dry, kasure streaks). Strokes only extend past the furthest point reached,
so the circle is a record of how this visitor travelled. It is also the route
map (waypoint ticks plus an accessible waypoint list). At the finale it scales
out of its corner into the sky above the nursery gate as the moon, and the seal
lands on it. Coded in the page; the engine is untouched.

## Score (one leg per waypoint, one pace)

As built. Pace is constant: the mid plane travels 0.8 band-heights per vh of
scroll (far 0.32x, mist 0.6x, hung scrolls 1.06x, near 1.4x).

| Leg | Weight (vh) | Device | Why this one |
|---|---|---|---|
| 山 Mountain | 1.3 | Layered planes travelling right, hero copy lead | Depth from differential lateral travel is the establishing shot |
| 手 The hand | 1.3 | Planes + lead copy window | Copy in the paper space, the hand scene crosses beneath |
| 四季 Seasons | 2.0 | Planes, four repeated trees, trail copy | The repetition *is* the device: same tree, four states |
| 墨 Ink (peak) | **3.1** | Paper veil, authored silence, WebGL ink bloom, painting into photograph | Change of state: ink becomes tree becomes a real tree |
| 庭 The nursery | 2.0 | Planes + four hanging-scroll specimens (live catalog) | Objects with factual labels, the shop |
| 学 The bench | 1.3 | Planes + trail copy, two links | Short, informational, compressed on purpose |
| 印 The seal | 1.4 | Ensō rises as the moon, seal CTA, colophon | Arrival and resolution; holds to the end |

Total weight 12.4, so the spacer is 13.4vh. The peak is the largest leg by 1.1vh.

Authored silence (as built): the veil closes over the seasons from t=4.72,
is fully closed at ~5.1, and the drop lands at t=5.4. That stretch of blank
paper is deliberate.

## Feel check (2026-10-07)

Done after the desktop and phone sheets and two wheel-driven runs, before
re-reading this file.

| Leg | Intended | Felt | Change made |
|---|---|---|---|
| 山 | Stillness | Calm, establishing | none |
| 手 | Curiosity | Curious, close | none |
| 四季 | Reverence | Contemplative; time passing | none; the row reads as time, which is the point |
| 墨 | Awe, then desire | Anticipation, then the strongest change on the page | The resolved photograph held for only ~0.28vh; leg lengthened to 3.1 and phases moved earlier so it holds ~0.5vh |
| 庭 | Desire into trust | Abundance, browsing | Accepted: the busiest frame on the page, by intent (the shop). Oak moved left so it no longer touches the copy |
| 学 | Belonging | Warmth | none |
| 印 | Resolve | Completion, personal | Moon moved into open sky; seal moved under the ensō on phones |

Peak check: the bloom is the largest visual change on the sheet and owns the
most scroll. The leg before it (seasons) is quieter. The last screen holds with
content (moon, seal, colophon).

## Revision 1 (2026-10-07, owner feedback)

"The image with the 2 hands wiring a branch ... looks cut-off" and "the big tree
in the background in 'catalog' section ... is cutoff at the top and left side,
again making the site look cheap because it looks like a bad layout issue."

Cause: both paintings ran off their own paper (oak crown at top and left, branch
at top), so a hard edge travelled across the screen. Regenerated both with the
whole subject inside the paper (`m-hands2`, `m-nursery2`; picked from two
variants each). An edge audit of every plate found three more painted-off edges
(rocks left, marsh washes, gate and pine bases on phones); those are now
feathered into the ground with a per-plate mask (`fade` in `lib/makimono/track.ts`).
Season kanji now fade in with the seasons copy so they never cross other text.
