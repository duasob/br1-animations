(function () {
    const { rgba } = window.__portfolioAnimUtils;

    // A grid of arrows, fixed in the canvas, but only those within "Area" of
    // the cursor are drawn (fading toward that radius). Each arrow eases toward
    // a direction that blends a slowly-rotating ambient flow with a repulsion
    // away from the cursor — so the field visibly reacts as the mouse passes.
    function create() {
        const cells = new Map(); // key -> { x, y, ang, energy }
        let t = 0;
        const P = { area: 120, density: 5, fade: 1.2 };
        return {
            name: "Field",
            params: [
                {
                    key: "area",
                    label: "Area",
                    min: 40,
                    max: 220,
                    step: 5,
                    value: 120,
                },
                {
                    key: "density",
                    label: "Density",
                    min: 1,
                    max: 10,
                    step: 1,
                    value: 5,
                },
                {
                    key: "fade",
                    label: "Fade",
                    min: 0.3,
                    max: 4,
                    step: 0.1,
                    value: 1.2,
                },
            ],
            setParam(k, v) {
                P[k] = v;
                if (k === "density") cells.clear();
            },
            init() {
                cells.clear();
            },
            frame(env) {
                const { ctx, W, H, mouse, active, intensity, dt, color } = env;
                t += dt;
                const area = P.area;
                const spacing = Math.max(
                    10,
                    Math.round(48 - (P.density - 1) * 3.5),
                );
                const ambient = t * 0.15;
                const ax = Math.cos(ambient),
                    ay = Math.sin(ambient);
                const easeT = Math.min(1, dt * 8);

                if (active) {
                    const iMin = Math.floor((mouse.x - area) / spacing);
                    const iMax = Math.ceil((mouse.x + area) / spacing);
                    const jMin = Math.floor((mouse.y - area) / spacing);
                    const jMax = Math.ceil((mouse.y + area) / spacing);
                    for (let i = iMin; i <= iMax; i++) {
                        for (let j = jMin; j <= jMax; j++) {
                            const x = i * spacing + spacing / 2;
                            const y = j * spacing + spacing / 2;
                            if (x < 0 || x > W || y < 0 || y > H) continue;
                            const dx = x - mouse.x,
                                dy = y - mouse.y;
                            const dist = Math.hypot(dx, dy);
                            if (dist > area) continue;

                            const w = 1 - dist / area;
                            const r = dist || 1;
                            const rx = dx / r,
                                ry = dy / r;
                            const k = w * 1.6;
                            const target = Math.atan2(
                                ay * (1 - w) + ry * k,
                                ax * (1 - w) + rx * k,
                            );

                            const key = i + "," + j;
                            let cell = cells.get(key);
                            if (!cell) {
                                cell = { x: x, y: y, ang: target, energy: 0 };
                                cells.set(key, cell);
                            }
                            let d = target - cell.ang;
                            if (d > Math.PI) d -= 2 * Math.PI;
                            else if (d < -Math.PI) d += 2 * Math.PI;
                            cell.ang += d * easeT;
                            const smooth = w * w * (3 - 2 * w);
                            if (smooth > cell.energy) cell.energy = smooth;
                        }
                    }
                }

                const decay = Math.exp(-dt * P.fade);
                ctx.lineWidth = 1;
                ctx.lineCap = "round";
                for (const [key, cell] of cells) {
                    cell.energy *= decay;
                    const a = cell.energy * intensity * 0.75;
                    if (a <= 0.01) {
                        cells.delete(key);
                        continue;
                    }
                    const len = spacing * (0.45 + 0.35 * cell.energy);
                    const hx = Math.cos(cell.ang),
                        hy = Math.sin(cell.ang);
                    const x1 = cell.x + (hx * len) / 2,
                        y1 = cell.y + (hy * len) / 2;
                    const x0 = cell.x - (hx * len) / 2,
                        y0 = cell.y - (hy * len) / 2;
                    const hs = Math.min(4.5, len * 0.45);
                    ctx.strokeStyle = rgba(color, a);
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(
                        x1 + Math.cos(cell.ang + 2.5) * hs,
                        y1 + Math.sin(cell.ang + 2.5) * hs,
                    );
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(
                        x1 + Math.cos(cell.ang - 2.5) * hs,
                        y1 + Math.sin(cell.ang - 2.5) * hs,
                    );
                    ctx.stroke();
                }
            },
        };
    }

    window.__portfolioAnimations.push(create());
})();
