(function () {
    // Primitives shared by all animations. Loaded once before any animation
    // script; exposes a small namespace on window so each animation file can
    // pull what it needs without bundlers or ES modules (which would break
    // when the site is opened over file://).

    function mix(a, b, t) {
        return [
            Math.round(a[0] + (b[0] - a[0]) * t),
            Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t),
        ];
    }

    function rgba(c, a) {
        return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
    }

    // ---- vector-flow primitives ---------------------------------------
    // Shared streak renderer defaults: short trails advected from the cursor,
    // revealed only nearby and eased in/out over their lifetime.
    const FLOW = {
        MAX_AGE: 1.3,
        SPAWN: 2,
        TRAIL: 10,
        MAX: 800,
        ALPHA: 0.45,
        REVEAL: 75,
    };

    function integrate(p, dt, rate, maxStep, deriv) {
        const total = rate * dt;
        const n = Math.max(1, Math.min(6, Math.ceil(total / maxStep)));
        const h = total / n;
        for (let i = 0; i < n; i++) {
            const d = deriv(p.X, p.Y, p.Z);
            p.X += d[0] * h;
            p.Y += d[1] * h;
            p.Z += d[2] * h;
        }
    }

    // Build a flow-style animation object from a small config. See the
    // animations/README.md and the br1-animations repo for the full
    // interface and a working example.
    function flowAnim(cfg) {
        let particles = [];
        const P = {};
        Object.assign(P, cfg.fixed || {}); // non-slider defaults
        (cfg.params || []).forEach((pr) => (P[pr.key] = pr.value));
        return {
            name: cfg.name,
            params: cfg.params || [],
            setParam(key, v) {
                P[key] = v;
            },
            init() {
                particles = [];
            },
            frame(env) {
                const { ctx, W, H, mouse, active, intensity, dt, color } = env;
                // render params: per-animation override of the shared FLOW defaults
                const pick = (k, d) => (P[k] !== undefined ? P[k] : d);
                const spawnN = pick("spawn", FLOW.SPAWN);
                const trail = pick("trail", FLOW.TRAIL);
                const maxAge = pick("maxAge", FLOW.MAX_AGE);
                const reveal = pick("reveal", FLOW.REVEAL);
                const alpha = pick("alpha", FLOW.ALPHA);
                const width = pick("width", 1.1);

                if (active) {
                    for (let i = 0; i < spawnN; i++) {
                        const jx = mouse.x + (Math.random() - 0.5) * 6;
                        const jy = mouse.y + (Math.random() - 0.5) * 6;
                        const p = cfg.seed(jx, jy, W, H, P);
                        if (p.x === undefined) {
                            p.x = jx;
                            p.y = jy;
                        }
                        p.age = 0;
                        p.pts = [{ x: p.x, y: p.y }];
                        particles.push(p);
                        if (particles.length > FLOW.MAX) particles.shift();
                    }
                }

                ctx.lineWidth = width;
                ctx.lineCap = "round";
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    const pt = cfg.step(p, dt, W, H, mouse, P);
                    p.age += dt;
                    if (!isFinite(pt.x) || !isFinite(pt.y)) {
                        particles.splice(i, 1);
                        continue;
                    }
                    p.pts.push(pt);
                    if (p.pts.length > trail) p.pts.shift();

                    const out =
                        pt.x < -20 ||
                        pt.x > W + 20 ||
                        pt.y < -20 ||
                        pt.y > H + 20;

                    let ease, mask;
                    if (P.fade !== undefined) {
                        // persistence mode: streaks stay where drawn and fade over time,
                        // revealing the whole field rather than a pocket round the cursor
                        ease = Math.exp(-p.age * P.fade);
                        mask = 1;
                        if (ease < 0.02 || out) {
                            particles.splice(i, 1);
                            continue;
                        }
                    } else {
                        if (p.age > maxAge || out) {
                            particles.splice(i, 1);
                            continue;
                        }
                        ease = Math.sin(
                            Math.PI * Math.min(p.age / maxAge, 1),
                        );
                        const dx = pt.x - mouse.x,
                            dy = pt.y - mouse.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        mask = Math.max(0, 1 - dist / reveal);
                    }

                    const a = alpha * ease * mask * intensity;
                    if (a <= 0.003 || p.pts.length < 2) continue;

                    ctx.strokeStyle = rgba(color, a);
                    ctx.beginPath();
                    ctx.moveTo(p.pts[0].x, p.pts[0].y);
                    for (let j = 1; j < p.pts.length; j++)
                        ctx.lineTo(p.pts[j].x, p.pts[j].y);
                    ctx.stroke();
                }
            },
        };
    }

    window.__portfolioAnimUtils = { mix, rgba, FLOW, integrate, flowAnim };
    if (!window.__portfolioAnimations) window.__portfolioAnimations = [];
})();
