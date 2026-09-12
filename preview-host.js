// Minimal preview host for br1-animations.
// Subset of the br1.me hero engine: owns the canvas, the rAF loop, the
// theme accent colour and the radial edge fade; animations plug in through
// window.__portfolioAnimations exactly like on the site.
(function () {
    const stage = document.getElementById("stage");
    const tabsEl = document.getElementById("tabs");
    const panelEl = document.getElementById("panel");
    const themeBtn = document.getElementById("themeToggle");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    stage.appendChild(canvas);

    // ---- host state -----------------------------------------------------
    const ANIMATIONS = window.__portfolioAnimations || [];
    const mouse = { x: 0, y: 0 };
    let mouseInside = false;
    let intensity = 0;
    let index = 0;
    let anim = null;

    const env = {
        ctx,
        W: 0,
        H: 0,
        dt: 0,
        mouse,
        active: false,
        intensity: 0,
        color: [155, 138, 184],
    };

    // ---- theme ----------------------------------------------------------
    function prefersDark() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function applyTheme(dark) {
        if (dark) document.documentElement.setAttribute("data-theme", "dark");
        else document.documentElement.removeAttribute("data-theme");
        themeBtn.textContent = dark ? "Light" : "Dark";
        readAccent();
    }

    function readAccent() {
        const v = getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim();
        const m = /^#?([0-9a-f]{6})$/i.exec(v);
        if (m) {
            const n = parseInt(m[1], 16);
            env.color = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
    }

    applyTheme(prefersDark());
    themeBtn.addEventListener("click", () => {
        applyTheme(
            document.documentElement.getAttribute("data-theme") !== "dark"
        );
    });

    let W = 0,
        H = 0,
        dpr = 1;

    function resize() {
        const r = stage.getBoundingClientRect();
        W = r.width;
        H = r.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        env.W = W;
        env.H = H;
        if (anim && anim.init) anim.init(env);
    }

    // ---- tabs -----------------------------------------------------------
    function buildTabs() {
        tabsEl.textContent = "";
        ANIMATIONS.forEach((a, i) => {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = a.name;
            if (i === index) b.classList.add("active");
            b.addEventListener("click", () => select(i));
            tabsEl.appendChild(b);
        });
    }

    function select(i) {
        index = i;
        anim = ANIMATIONS[i];
        if (anim && anim.init) anim.init(env);
        buildTabs();
        buildPanel();
        start();
    }

    // ---- param sliders --------------------------------------------------
    function decimalsOf(step) {
        const s = String(step);
        return s.indexOf(".") >= 0 ? s.split(".")[1].length : 0;
    }

    function buildPanel() {
        panelEl.textContent = "";
        const params = (anim && anim.params) || [];
        if (!params.length) {
            const p = document.createElement("span");
            p.className = "empty";
            p.textContent = "no parameters";
            panelEl.appendChild(p);
            return;
        }
        for (const pr of params) {
            const row = document.createElement("div");
            row.className = "row";

            const label = document.createElement("label");
            const name = document.createElement("span");
            name.textContent = pr.label;
            const val = document.createElement("span");
            val.className = "val";
            const dec = decimalsOf(pr.step);
            val.textContent = pr.value.toFixed(dec);
            label.appendChild(name);
            label.appendChild(val);

            const input = document.createElement("input");
            input.type = "range";
            input.min = pr.min;
            input.max = pr.max;
            input.step = pr.step;
            input.value = pr.value;
            input.addEventListener("input", () => {
                const v = parseFloat(input.value);
                pr.value = v;
                val.textContent = v.toFixed(dec);
                if (anim.setParam) anim.setParam(pr.key, v);
                if (pr.reinit && anim.init) anim.init(env);
                start();
            });

            row.appendChild(label);
            row.appendChild(input);
            panelEl.appendChild(row);
        }
    }

    // ---- cursor ---------------------------------------------------------
    stage.addEventListener("mouseenter", () => {
        mouseInside = true;
        start();
    });
    stage.addEventListener("mouseleave", () => {
        mouseInside = false;
    });
    stage.addEventListener("mousemove", (e) => {
        const r = stage.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
        start();
    });

    // ---- loop -----------------------------------------------------------
    let last = 0;
    let activeUntil = 0;
    let vt = 0;
    let running = false;

    function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        // Drive a virtual cursor when the mouse is elsewhere so the preview
        // never sits completely static.
        const preview = !mouseInside;
        if (preview) {
            vt += dt;
            mouse.x = W / 2 + Math.cos(vt * 0.9) * W * 0.3;
            mouse.y = H / 2 + Math.sin(vt * 1.3) * H * 0.3;
        }
        const active = true;
        intensity += ((active ? 1 : 0) - intensity) * Math.min(dt * 6, 1);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        if (anim) {
            env.dt = dt;
            env.active = active;
            env.intensity = intensity;
            anim.frame(env);

            const cx = W / 2,
                cy = H / 2,
                R = Math.min(W, H) * 0.5;
            const g = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R);
            g.addColorStop(0, "rgba(0,0,0,1)");
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "destination-in";
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = "source-over";
        }

        requestAnimationFrame(loop);
    }

    function start() {
        if (running) return;
        running = true;
        last = performance.now();
        requestAnimationFrame(loop);
    }

    // ---- boot -----------------------------------------------------------
    // Animation scripts are injected asynchronously by preview.html; poll
    // until at least one has registered (or give up after a few seconds).
    const boot = () => {
        if (!ANIMATIONS.length) return false;
        resize();
        window.addEventListener("resize", resize);
        readAccent();
        select(0);
        start();
        return true;
    };

    if (!boot()) {
        const poll = setInterval(() => {
            if (boot()) clearInterval(poll);
        }, 100);
        setTimeout(() => clearInterval(poll), 5000);
    }
})();
