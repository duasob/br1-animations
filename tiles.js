(function () {
    const { mix, rgba } = window.__portfolioAnimUtils;

    // A grid of tiles that flip from one shade to another as the cursor sweeps
    // across them, then quietly fade back out.
    function create() {
        let cells = [],
            cols = 0,
            rows = 0,
            cw = 0,
            ch = 0;
        const P = { size: 24, fade: 3 };
        return {
            name: "Tiles",
            params: [
                {
                    key: "size",
                    label: "Tile size",
                    min: 6,
                    max: 60,
                    step: 1,
                    value: 24,
                    reinit: true,
                },
                {
                    key: "fade",
                    label: "Fade",
                    min: 1,
                    max: 8,
                    step: 0.1,
                    value: 3,
                },
            ],
            setParam(key, v) {
                P[key] = v;
            },
            init(env) {
                cols = Math.max(1, Math.round(env.W / P.size));
                rows = Math.max(1, Math.round(env.H / P.size));
                cw = env.W / cols;
                ch = env.H / rows;
                cells = [];
                for (let i = 0; i < cols * rows; i++)
                    cells.push({ lit: 0, flip: 0 });
            },
            frame(env) {
                const { ctx, mouse, active, intensity, dt, color } = env;
                if (active) {
                    const c = Math.floor(mouse.x / cw);
                    const r = Math.floor(mouse.y / ch);
                    if (c >= 0 && c < cols && r >= 0 && r < rows) {
                        const cell = cells[r * cols + c];
                        if (cell.lit < 0.25) cell.flip = 1;
                        cell.lit = 1;
                    }
                }

                const colA = color;
                const colB = mix(color, [255, 255, 255], 0.55);
                const size = Math.min(cw, ch) - 4;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const cell = cells[r * cols + c];
                        if (cell.lit <= 0.001) continue;
                        cell.lit *= Math.exp(-dt * P.fade);
                        if (cell.flip > 0)
                            cell.flip = Math.max(0, cell.flip - dt * 4);

                        const a = cell.lit * 0.5 * intensity;
                        if (a <= 0.004) continue;
                        const sx = Math.abs(2 * cell.flip - 1);
                        const col = cell.flip > 0.5 ? colA : colB;
                        const cx = (c + 0.5) * cw,
                            cy = (r + 0.5) * ch;

                        ctx.save();
                        ctx.translate(cx, cy);
                        ctx.scale(sx, 1);
                        ctx.fillStyle = rgba(col, a);
                        ctx.beginPath();
                        if (ctx.roundRect)
                            ctx.roundRect(-size / 2, -size / 2, size, size, 3);
                        else ctx.rect(-size / 2, -size / 2, size, size);
                        ctx.fill();
                        ctx.restore();
                    }
                }
            },
        };
    }

    window.__portfolioAnimations.push(create());
})();
