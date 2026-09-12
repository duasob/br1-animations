# br1-animations

Community-contributed canvas animations for [br1.me](https://br1.me). Each animation is a single self-contained JS file that runs on the interactive canvas on the home page. To contribute, write one file and open a PR — no build step, no bundler.

## Contributing

1. Fork this repo
2. Copy the starter template below into a new file at the repo root, e.g. `vortex.js` (next to `lorenz.js` and friends)
3. Test locally (see [Testing locally](#testing-locally))
4. Open a pull request

Your PR will be reviewed, tried on the live site, and if accepted the animation gets integrated into br1.me. The PR will be merged (or closed) to reflect the outcome.

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

This repo ships a small preview host (`preview.html` + `preview-host.js`) that mimics the br1.me canvas — theme colours, radial fade, sliders for your animation's `params`.

1. Serve the repo folder (a server is required; `file://` won't work):

```sh
python3 -m http.server
```

2. Open the preview, pointing `?anim=` at your file (comma-separate to load several):

```
http://localhost:8000/preview.html?anim=vortex.js
```

With no `?anim=` parameter the page loads the example animations (`lorenz.js`, `field.js`, `tiles.js`), so you can also use it to explore how those work.

No edits to any other file are needed — the host discovers every animation that registers itself on `window.__portfolioAnimations` and shows it as a tab.

The same preview is also hosted live at [br1.me/a](https://br1.me/a/) — that page always shows the animations currently integrated into the site, so use it to see accepted work, and use your local clone to iterate on your own.

## Ordering

Animations appear in the picker in the order they are integrated into the site.
