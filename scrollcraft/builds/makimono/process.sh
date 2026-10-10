#!/usr/bin/env bash
# Generated ink paintings -> page assets.
#   planes: ink-alpha WebP (ink colour baked, paper -> transparent), trimmed to content.
#   peak:   grayscale textures for the WebGL bloom.
set -euo pipefail
cd "$(dirname "$0")"
DEST=../../../public/makimono
mkdir -p "$DEST"
INK="#1d211c"   # tokens.css --ink-1 (light)

paper() { # darkest of the four corner patches = brightest value that is still paper
  local f=$1 m=1
  for g in NorthWest NorthEast SouthWest SouthEast; do
    v=$(magick "$f" -colorspace Gray -gravity $g -crop 80x80+12+12 +repage -format "%[fx:mean]" info:)
    m=$(echo "$v $m" | awk '{print ($1<$2)?$1:$2}')
  done
  echo "$m"
}

plane() { # name maxheight [alpha gain]
  local n=$1 src=out/$1.png hi lo=3 mh=${2:-1200} gain=${3:-1}
  hi=$(paper "$src" | awk '{printf "%.1f", ($1-0.025)*100}')
  # alpha = ink density; anything under 3% is paper noise and goes to zero
  magick "$src" \( +clone -colorspace Gray -level ${lo}%,${hi}% -negate -level 3%,100% -evaluate multiply $gain \) \
    -alpha off -compose CopyOpacity -composite -fill "$INK" -colorize 100 \
    -trim +repage -bordercolor none -border 24 -resize "x${mh}>" "/tmp/mk-$n.png"
  # AVIF first (about half the bytes), WebP as the fallback for older Safari
  magick "/tmp/mk-$n.png" -quality 55 "$DEST/$n.avif"
  magick "/tmp/mk-$n.png" -quality 70 -define webp:alpha-quality=70 -define webp:method=6 "$DEST/$n.webp"
  # Narrower copies for srcset: a plate is drawn at band height x ratio, often far below full size.
  local w; w=$(magick identify -format '%w' "/tmp/mk-$n.png")
  for vw in 800 1600; do
    [ "$w" -gt "$vw" ] || continue
    magick "/tmp/mk-$n.png" -resize "${vw}x" -quality 55 "$DEST/$n-$vw.avif"
    magick "/tmp/mk-$n.png" -resize "${vw}x" -quality 70 -define webp:alpha-quality=70 -define webp:method=6 "$DEST/$n-$vw.webp"
  done
  echo "$n paper<${hi}% $(magick identify -format '%w %h' "$DEST/$n.webp") avif=$(du -k "$DEST/$n.avif" | cut -f1)KB webp=$(du -k "$DEST/$n.webp" | cut -f1)KB"
}

for n in m-pine m-hands2 m-spring m-summer m-autumn m-winter m-nursery2 m-bench m-gate n-rocks n-branch; do plane $n 1200; done
# far washes are painted very pale; lift them so the distance layer reads at all
for n in f-ridges f-marsh; do plane $n 900 1.9; done

# Peak textures: grayscale, no alpha. The shader reads luminance.
magick out/b-tree.png -colorspace Gray -resize 'x1400>' -quality 86 "$DEST/b-tree.jpg"
magick out/b-bloom.png -colorspace Gray -blur 0x3 -resize 'x900>' -quality 90 "$DEST/b-bloom.jpg"
ls -la "$DEST" | awk '{print $5, $9}'
