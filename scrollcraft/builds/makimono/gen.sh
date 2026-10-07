#!/usr/bin/env bash
# Asset generation for the makimono build. One preamble, verbatim, every prompt.
K=/Users/shotcowboystyle/www/shotcowboystyle/charlestonbonsai/.agents/skills/scroll-craft/scripts/kie.mjs
P="Traditional Japanese sumi-e ink painting in the spirit of Hasegawa Tohaku and Sesshu, brushed with pure black sumi ink on plain bright white paper. Diluted ink makes soft grey washes; confident dry-brush strokes show bristle texture; wet ink bleeds softly at the edges. Monochrome only, no colour at all. The subject is isolated on completely empty pure white paper with nothing behind it. NO red seal, NO stamp, NO signature, NO calligraphy, NO text, NO border, NO frame, NO paper texture, NO stains, NO background wash, NOT a photograph, NOT 3D, NOT digital illustration."
g() { node "$K" still "$P

$2" "out/$1.png" --ar "$3" ${4:+--ref "$4"} > "out/$1.log" 2>&1; echo "$1 done $?"; }
case "$1" in
wave1)
g m-pine "An ancient windswept pine growing out of a jagged rocky cliff outcrop. The twisted trunk leans and its branches reach far to the left in layered flat pads of dark needles; roots grip the rock. Pine and cliff sit in the left half of the frame, the cliff base touching the bottom edge. The whole right half of the paper is empty white." 16:9 &
g m-hands "Two human hands carefully bending a thin copper wire around a pine branch, seen close, a few pads of pine needles above the hands, drawn with sparse confident ink lines and pale grey washes. The hands and branch sit in the centre of the frame with wide empty white paper on both sides and above." 16:9 &
g m-summer "A small Japanese maple bonsai tree in a shallow oval pot, in full summer leaf, the canopy a soft dome of layered grey and black leaf washes, a graceful curved trunk with visible surface roots. The tree and pot are centred and fill the middle of the frame, with empty white paper above and to the sides." 3:4 &
g b-tree "A specimen bonsai juniper in a shallow rectangular pot. A dramatic twisting trunk with bare silvery deadwood, foliage in a few dense dark cloud-like pads. The tree and pot are centred and fill most of the frame; empty white paper around." 3:4 &
g b-bloom "A single large drop of black ink spreading outward on wet absorbent rice paper, seen from directly above. Darkest and densest at the very centre, fading into paler grey as it spreads, with feathery fibrous bleeding edges and fine tendrils following the paper fibres. The bloom is centred and fills most of the frame, empty white paper at the corners." 3:4 &
g m-nursery "Enormous old Lowcountry live oak trees with long trailing curtains of Spanish moss hanging from their spreading limbs; beneath them, long low wooden benches lined with many small bonsai trees in pots. The oaks fill the upper part of the frame from the left, the benches run along the lower third, and the right third of the paper is empty white." 16:9 &
g m-bench "A covered wooden porch of a mountain house. Three people sit at a long low workbench, each bent over a small bonsai tree, working with their hands. Faint layered mountain ridges in the far distance on the right. The porch and people occupy the centre and left, low in the frame; empty white paper above." 16:9 &
g m-gate "A simple wooden garden gate with a small tiled roof set in a low earthen wall, an old gnarled pine leaning over it from the left, a stepping-stone path leading up to the gate. Gate, wall and pine sit low in the lower left half of the frame. The entire upper right of the paper is empty white sky." 16:9 &
g f-ridges "Distant layered mountain ridges dissolving into mist, painted only in very pale, very diluted grey washes, extremely faint, each ridge paler than the one in front. The ridges occupy only the lower half of the frame across the full width; the upper half is empty white paper." 16:9 &
g f-marsh "A flat Lowcountry salt marsh at a great distance: a low horizon with a faint line of distant trees and reeds, painted only in very pale, diluted grey washes, extremely faint. The marsh is a thin band across the full width in the lower third of the frame; everything above is empty white paper." 16:9 &
g n-rocks "Dark foreground rocks and tufts of wild grass running along the bottom edge of the frame, heavy black ink and dry-brush strokes, close to the viewer. They form a low band across the full width touching the bottom edge, never rising above the lower quarter. Everything above is empty white paper." 16:9 &
g n-branch "A dark pine branch reaching in from the top right corner, heavy black ink needles in dense pads, close to the viewer, slightly soft. It occupies only the top right corner and hangs down into the upper third. The rest of the paper is empty white." 16:9 &
wait ;;
wave2)
g m-spring "The same maple bonsai tree in the same pot, in early spring: bare branches with tiny new buds and a few small fresh leaves, delicate thin lines. The tree and pot are centred, empty white paper above and to the sides." 3:4 out/m-summer.png &
g m-autumn "The same maple bonsai tree in the same pot, in late autumn: sparse remaining leaves, a few leaves falling through the air beside it, darker ink on the remaining foliage. The tree and pot are centred, empty white paper above and to the sides." 3:4 out/m-summer.png &
g m-winter "The same maple bonsai tree in the same pot, in winter: bare branches carrying soft white snow left as unpainted paper, the trunk and branch undersides in dark ink. The tree and pot are centred, empty white paper above and to the sides." 3:4 out/m-summer.png &
wait ;;
esac
# reroll: the first m-bench drew period costume; the real retreats are modern guests.
if [ "$1" = bench2 ]; then
g m-bench "The covered wooden porch of a simple modern mountain cabin. Three contemporary people in plain everyday clothes (simple shirts and trousers, short modern hair, no traditional costume) sit at a long low workbench, each bent over a small bonsai tree in a pot, working with their hands. Faint layered mountain ridges in the far distance on the right. The porch and people occupy the centre and left, low in the frame; empty white paper above." 16:9
fi
# reroll 2: m-nursery and m-hands were cropped by their own frame (oak at top/left,
# branch at top), which reads as a layout error once the plate travels on screen.
if [ "$1" = whole ]; then
NUR="One enormous old Lowcountry live oak with long trailing curtains of Spanish moss. Its whole spreading crown is complete inside the frame, the outer leaves and moss dissolving into soft mist, with a wide margin of empty white paper above the crown and to its left and right. Beneath it, a long low wooden bench lined with many small bonsai trees in pots. Oak and bench sit centre-left. Nothing touches or is cut by any edge of the paper; the right third of the paper is empty white."
HND="Two human hands carefully bending a thin copper wire around a short pine branch, seen close. The whole branch is visible: it begins in the left hand and ends in a small tuft of needles well inside the frame. The forearms fade softly into unpainted paper before reaching the bottom edge. Hands and branch sit in the centre with generous empty white paper on all four sides. Nothing touches or is cut by any edge of the paper."
g m-nursery-a "$NUR" 16:9 & g m-nursery-b "$NUR" 16:9 &
g m-hands-a "$HND" 16:9 & g m-hands-b "$HND" 16:9 &
wait
fi
