<template>
  <div>
    <!-- ───────────────────────────────────────────────────────────────
         The house grade.

         Every specimen photograph on this site is a phone snapshot taken
         wherever the tree happened to be standing: a living room, a bar
         wall, a cinderblock yard. The trees are real and the frames are
         not presentable, and the studio will keep adding more of them.

         So the grade is applied at render time rather than baked into
         files: desaturate, then map the tonal range onto the same ink
         scale tokens.css already defines — a warm sumi black point and
         an unbleached bone white point. Six incompatible photographs
         become one archival set, and the seventh does too, without
         anyone editing an image.

         Two stages, and the second one is a `table` rather than a
         `linear`. That is load-bearing: a linear ramp whose slope
         carries the top of the range past 1.0 clips it to pure white,
         and a bonsai photographed against a white table or a painted
         wall then loses its whole lower half to a flat rectangle. A
         two-entry table interpolates between the two ink-scale
         endpoints and cannot overshoot either of them.

         Stage one is the contrast and the input window folded into one
         line (it clamps to [0,1] between primitives, which is exactly
         the clamp the window needs); stage two lands the result between
         a warm sumi black point and an unbleached bone white point,
         per channel.

         sRGB interpolation is required: the default linearRGB washes
         the mid-tones out completely.
         ─────────────────────────────────────────────────────────────── -->
    <svg class="ink-defs" aria-hidden="true" focusable="false">
      <filter id="ink-plate" color-interpolation-filters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.711" intercept="-0.3795" />
          <feFuncG type="linear" slope="1.711" intercept="-0.3795" />
          <feFuncB type="linear" slope="1.711" intercept="-0.3795" />
        </feComponentTransfer>
        <feComponentTransfer>
          <feFuncR type="table" tableValues="0.105 0.950" />
          <feFuncG type="table" tableValues="0.115 0.938" />
          <feFuncB type="table" tableValues="0.092 0.908" />
        </feComponentTransfer>
      </filter>
    </svg>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Present but never laid out. `display: none` would stop Safari resolving
   url(#ink-plate) against it. */
.ink-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
