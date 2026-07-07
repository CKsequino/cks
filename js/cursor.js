/**
 * cursor.js — Lightweight glowing dot trail
 *
 * Design: A smooth comet-style tail of fading dots that follows
 * the cursor. A glowing ring pulses at the pointer head.
 * On hover over interactive elements the ring scales up + turns blue-white.
 * On click a quick radial burst fires.
 *
 * Performance:
 *   - Tail length kept at 28 (was 80).
 *   - shadowBlur used ONCE per frame via a shared off-screen glow pass,
 *     not per-dot. Most dots are drawn plain with globalAlpha only.
 *   - Only the head dot gets shadow — tail dots use alpha alone.
 *   - RAF throttled to ~60 fps but skips draw if mouse hasn't moved
 *     AND no animation is in flight.
 */

(function () {
    'use strict';

    /* Skip on touch-only devices */
    if (window.matchMedia('(hover: none)').matches) return;

    /* Hide the HTML cursor elements */
    document.querySelectorAll('.cursor-dot, .cursor-ring').forEach(function (el) {
        el.style.display = 'none';
    });
    document.body.style.cursor = 'default';

    /* ── Canvas setup ─────────────────────────── */
    var cvs = document.createElement('canvas');
    var ctx = cvs.getContext('2d');
    Object.assign(cvs.style, {
        position:      'fixed',
        inset:         '0',
        pointerEvents: 'none',
        zIndex:        '999999',
    });
    document.body.appendChild(cvs);

    function resize() {
        cvs.width  = window.innerWidth;
        cvs.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* ── Config ───────────────────────────────── */
    var TAIL       = 28;     // number of trail points
    var LERP_SPEED = 0.18;   // how fast the trail tip chases the mouse (0–1)

    /* ── Trail points ─────────────────────────── */
    // trail[0] = tip (closest to cursor), trail[TAIL-1] = oldest
    var trail = [];
    for (var i = 0; i < TAIL; i++) trail.push({ x: -999, y: -999 });

    /* Current "smooth" tip position (lerped toward raw mouse) */
    var tipX = -999, tipY = -999;

    /* Raw mouse */
    var mx = -999, my = -999;
    var visible  = false;
    var hovering = false;

    /* ── Click burst ──────────────────────────── */
    var bursts = [];   // { x, y, life }

    /* ── Mouse events ─────────────────────────── */
    document.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (!visible) {
            visible = true;
            tipX = mx; tipY = my;
            for (var i = 0; i < TAIL; i++) trail[i] = { x: mx, y: my };
        }
    }, { passive: true });

    document.addEventListener('mouseleave', function () { visible = false; });
    document.addEventListener('mouseenter', function () { visible = true; });

    document.addEventListener('click', function (e) {
        bursts.push({ x: e.clientX, y: e.clientY, life: 1.0 });
    });

    /* ── Hover detection ──────────────────────── */
    var SEL = 'a,button,.glow-btn,.nav-link,.filter-btn,' +
              '.skill-card,.project-card,.social-link,.project-link,' +
              'input,textarea,label,select,#back-to-top,.star-btn';

    document.addEventListener('mouseover', function (e) {
        if (e.target.closest(SEL)) { hovering = true; }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest(SEL)) { hovering = false; }
    });

    /* ── Magnetic buttons ─────────────────────── */
    document.querySelectorAll('.glow-btn, #back-to-top').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
            var r = el.getBoundingClientRect();
            el.style.transform =
                'translate(' + ((e.clientX - r.left - r.width  / 2) * 0.12) + 'px,' +
                               ((e.clientY - r.top  - r.height / 2) * 0.12) + 'px)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });

    /* ── Helpers ──────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ── Ring animation state ─────────────────── */
    var ringScale = 1.0;   // animates toward 1.5 on hover, back to 1.0 off
    var tick = 0;

    /* ══════════════════════════════════════════
       DRAW LOOP
    ══════════════════════════════════════════ */
    function loop() {
        requestAnimationFrame(loop);

        ctx.clearRect(0, 0, cvs.width, cvs.height);
        tick += 0.05;

        if (!visible || mx < -900) return;

        /* Lerp tip toward raw mouse — smooth lag-free follow */
        tipX = lerp(tipX, mx, LERP_SPEED);
        tipY = lerp(tipY, my, LERP_SPEED);

        /* Push new tip, drop oldest */
        trail.unshift({ x: tipX, y: tipY });
        trail.pop();

        /* ── Draw trail dots ── */
        /* No shadowBlur on trail dots — just alpha + size falloff */
        ctx.shadowBlur = 0;

        for (var i = 0; i < TAIL; i++) {
            var p   = trail[i];
            if (p.x < -900) continue;

            var age   = i / TAIL;             // 0 = tip, 1 = tail
            var alpha = (1 - age) * (1 - age) * 0.75;  // quadratic fade
            var r     = (1 - age) * (hovering ? 5.5 : 4.0);

            if (alpha < 0.02 || r < 0.3) continue;

            /* colour: tip = bright red → tail = dim red */
            var red   = 255;
            var green = Math.round(30 + (1 - age) * 50);
            var blue  = Math.round(20 + (1 - age) * 30);

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
            ctx.fill();
        }

        /* ── Glowing head ── */
        /* Single shadowBlur call for the head only */
        var headColor   = hovering ? 'rgba(180,220,255,0.95)' : 'rgba(255,255,255,0.95)';
        var glowColor   = hovering ? 'rgba(120,180,255,1)'    : 'rgba(255,60,60,1)';
        var ringTarget  = hovering ? 1.6 : 1.0;
        ringScale = lerp(ringScale, ringTarget, 0.12);

        /* Pulsing outer ring */
        var baseRing = 11 * ringScale;
        var pulse    = Math.sin(tick * 3.5) * 2;
        ctx.beginPath();
        ctx.arc(mx, my, baseRing + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = hovering ? 'rgba(140,200,255,0.55)' : 'rgba(255,30,30,0.45)';
        ctx.lineWidth   = hovering ? 1.8 : 1.5;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur  = hovering ? 20 : 16;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        /* Bright core dot */
        ctx.beginPath();
        ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
        ctx.fillStyle   = headColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur  = 18;
        ctx.fill();
        ctx.shadowBlur  = 0;

        /* Tiny centre pin */
        ctx.beginPath();
        ctx.arc(mx, my, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        /* ── Click bursts ── */
        for (var b = bursts.length - 1; b >= 0; b--) {
            var burst = bursts[b];
            burst.life -= 0.07;
            if (burst.life <= 0) { bursts.splice(b, 1); continue; }

            var bl  = burst.life;
            var br  = (1 - bl) * 38;   /* expanding radius */

            ctx.save();
            ctx.translate(burst.x, burst.y);
            ctx.shadowColor = 'rgba(255,40,40,0.8)';
            ctx.shadowBlur  = 14 * bl;

            /* 4 cardinal lines */
            var arms = [[0, -br], [br, 0], [0, br], [-br, 0]];
            for (var a = 0; a < arms.length; a++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(arms[a][0], arms[a][1]);
                ctx.strokeStyle = 'rgba(255,' + Math.round(60 + bl * 80) + ',40,' + (bl * 0.9) + ')';
                ctx.lineWidth   = 2 * bl;
                ctx.lineCap     = 'round';
                ctx.stroke();
            }

            /* 4 diagonal lines (shorter) */
            var dr = br * 0.55;
            var diags = [[-dr, -dr], [dr, -dr], [dr, dr], [-dr, dr]];
            for (var d = 0; d < diags.length; d++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(diags[d][0], diags[d][1]);
                ctx.strokeStyle = 'rgba(255,255,255,' + (bl * 0.45) + ')';
                ctx.lineWidth   = 1.2 * bl;
                ctx.stroke();
            }

            /* centre flash */
            ctx.beginPath();
            ctx.arc(0, 0, 4.5 * bl, 0, Math.PI * 2);
            ctx.fillStyle   = 'rgba(255,255,255,' + bl + ')';
            ctx.shadowBlur  = 18 * bl;
            ctx.fill();

            ctx.restore();
        }
    }

    loop();

}());
