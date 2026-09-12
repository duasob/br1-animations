# br1-animations

Canvas animations for [br1.me](https://br1.me). Each animation is a single self-contained JS file that runs on the interactive canvas on the home page. Contribute your own :) 

You can use `preview.html` to test locally. This will render like [br1.me/a/](https://br1.me/a/)

## Interface

Every animation is a plain object pushed onto `window.__portfolioAnimations`:

```js
(function () {
    window.__portfolioAnimations.push({
        name:   "My Animation",     // shown in the picker UI

        // Tunable parameters exposed as sliders in the panel.
        // omit the array (or leave it empty) if there are no params.
        params: [
            {
                key:    "speed",    // internal key passed to setParam / frame
                label:  "Speed",    // label shown in the UI
                min:    0.1,
                max:    5,
                step:   0.1,
                value:  1,          // initial value
                reinit: false,      // if true, init() is called after the slider changes
            },
        ],

        // Called whenever a param with reinit:true changes, or when the
        // canvas is resized. Use this to rebuild grids, clear state, etc.
        // Optional — omit if your animation has no setup work.
        init(env) { },

        // Called when a param slider moves.
        setParam(key, value) { },

        // Called every frame while the canvas is active. Draw onto env.ctx.
        // The canvas is already cleared before each call.
        frame(env) { },
    });
})();
```

## The `env` object

| Field | Type | Description |
|---|---|---|
| `ctx` | `CanvasRenderingContext2D` | Already cleared, DPR-scaled |
| `W` | `number` | Canvas width in CSS pixels |
| `H` | `number` | Canvas height in CSS pixels |
| `dt` | `number` | Seconds elapsed since the last frame |
| `mouse` | `{ x, y }` | Cursor position in CSS pixels |
| `active` | `boolean` | `true` while the cursor is over the canvas |
| `intensity` | `number` | `0..1`, eased fade in/out as the cursor enters/leaves |
| `color` | `[r, g, b]` | Current theme accent colour |

## Shared utilities (`utils/_shared.js`)

Primitives useful across animations, exposed as `window.__portfolioAnimUtils`:

```js
const { mix, rgba, FLOW, integrate, flowAnim } = window.__portfolioAnimUtils;
```

| Export | Signature | Description |
|---|---|---|
| `mix(a, b, t)` | `([r,g,b], [r,g,b], number) → [r,g,b]` | Linear interpolate two RGB colours |
| `rgba(c, a)` | `([r,g,b], number) → string` | Format a CSS `rgba(...)` string |
| `FLOW` | object | Default constants for flow-style animations |
| `integrate(p, dt, rate, maxStep, deriv)` | — | Sub-step RK integrator for chaotic systems |
| `flowAnim(cfg)` | `(config) → animation` | Build a particle-trail animation from a seed + step function |

`lorenz.js`, `field.js`, and `tiles.js` are working examples that use these primitives — read them for reference.

`utils/_shared.js` ships with the host site; changes to it should be discussed in your PR before being merged.

## Starter template

```js
(function () {
    window.__portfolioAnimations.push({
        name: "Vortex",
        params: [],
        setParam() {},
        frame(env) {
            const { ctx, W, H, mouse, intensity } = env;
            // draw something on ctx
        },
    });
})();
```

## Previewing your animation

This repo ships a small preview host (`preview.html` + `preview-host.js`) that mimics [br1.me/a/](https://br1.me/a/)
