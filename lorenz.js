(function () {
    const { flowAnim, integrate } = window.__portfolioAnimUtils;

    // Lorenz attractor advected from the cursor. Each particle is a short
    // trail integrated through the classic system; trails fade with age and
    // only show up near the cursor.
    const animation = flowAnim({
        name: "Lorenz",
        fixed: { rate: 0.36, s: 5, spawn: 3, alpha: 0.5 },
        params: [
            {
                key: "fade",
                label: "Fade",
                min: 0.3,
                max: 4,
                step: 0.1,
                value: 1.2,
            },
            {
                key: "trail",
                label: "Trail",
                min: 4,
                max: 80,
                step: 1,
                value: 40,
            },
            { key: "rho", label: "ρ", min: 18, max: 40, step: 0.5, value: 28 },
        ],
        seed(px, py, W, H, P) {
            return {
                X: (px - W / 2) / P.s,
                Y: (px - W / 2) / P.s,
                Z: (py - H / 2) / P.s + 25,
            };
        },
        step(p, dt, W, H, _mouse, P) {
            integrate(p, dt, P.rate, 0.01, (X, Y, Z) => [
                10 * (Y - X),
                X * (P.rho - Z) - Y,
                X * Y - (8 / 3) * Z,
            ]);
            return {
                x: p.X * P.s + W / 2,
                y: (p.Z - 25) * P.s + H / 2,
            };
        },
    });

    window.__portfolioAnimations.push(animation);
})();
