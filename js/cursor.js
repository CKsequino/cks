/**
 * cursor.js — Glowing dot trail for BOTH mouse and touch
 *
 * Desktop: follows the mouse cursor with comet trail + glow ring + click burst
 * Mobile/Tablet: follows finger touch with the same comet trail + tap burst
 *
 * Touch note: `touchmove` tracks the finger; `touchstart` seeds the trail
 * position instantly so the first frame is never blank.
 *
 * Performance:
 *  - TAIL = 28 dots, no per-dot shadowBlur (only head gets it)
 *  - canvas display:none removed — always present but pointer-events:none
 *  - On mobile the default browser cursor is irrelevant (no cursor on touch)
 */

(function () {
    'use strict';

    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    /* ── Canvas ─────────────────────────────── */
    var cvs = document.createElement('canvas');
    var ctx = cvs.getContext('2d');
    Object.assign(cvs.style, {
        position:      'fixed',
        top:           '0',
        left:          '0',
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

    /* ── Config ─────────────────────────────── */
    var TAIL       = 28;
    var LERP       = isTouch ? 0.28 : 0.18; // touch: slightly snappier

    /* ── State ──────────────────────────────── */
    var trail   = [];
    for (var i = 0; i < TAIL; i++) trail.push({ x: -999, y: -999 });

    var tipX = -999, tipY = -999;
    var mx   = -999, my   = -999;
    var visible  = false;
    var hovering = false;
    var bursts   = [];
    var tick     = 0;
    var ringScale = 1.0;

    /* ── Helpers ────────────────────────────── */
    function lerp(a, b, t) { return a + (b - a) * t; }

    function seed(x, y) {
        mx = x; my = y;
        if (!visible) {
            visible = true;
            tipX = x; tipY = y;
            for (var j = 0; j < TAIL; j++) trail[j] = { x: x, y: y };
        }
    }

    /* ── Mouse events (desktop) ─────────────── */
    document.addEventListener('mousemove', function (e) {
        seed(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function () { visible = false; });
    document.addEventListener('mouseenter', function () { visible = true; });

    document.addEventListener('click', function (e) {
        bursts.push({ x: e.clientX, y: e.clientY, life: 1.0 });
    });

    /* ── Touch events (mobile/tablet) ──────── */
    document.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        seed(t.clientX, t.clientY);
        bursts.push({ x: t.clientX, y: t.clientY, life: 0.8 });
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        seed(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener('touchend', function () {
        /* Fade out after finger lifts — let trail die naturally */
        visible = false;
    }, { passive: true });

    /* ── Hover detection (desktop only) ─────── */
    if (!isTouch) {
        var SEL = 'a,button,.glow-btn,.nav-link,.filter-btn,' +
                  '.skill-card,.project-card,.social-link,.project-link,' +
                  'input,textarea,label,select,#back-to-top,.star-btn';

        document.addEventListener('mouseover', function (e) {
            if (e.target.closest(SEL)) hovering = true;
        });
        document.addEventListener('mouseout', function (e) {
            if (e.target.closest(SEL)) hovering = false;
        });

        /* Magnetic buttons — desktop only */
        document.querySelectorAll('.glow-btn, #back-to-top').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                el.style.transform =
                    'translate(' + ((e.clientX - r.left - r.width  / 2) * 0.12) + 'px,' +
                                   ((e.clientY - r.top  - r.height / 2) * 0.12) + 'px)';
            });
            el.addEventListener('mouseleave', function () {
                el.style.transform = '';
            });
        });
    }

    /* ══════════════════════════════════════════
       DRAW LOOP
    ══════════════════════════════════════════ */
    function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        tick += 0.05;

        /* Always animate bursts even when finger is lifted */
        var hasBursts = bursts.length > 0;

        if (!visible && !hasBursts) {
            /* Drain the trail smoothly after touch ends */
            tipX = lerp(tipX, mx, LERP);
            tipY = lerp(tipY, my, LERP);
            trail.unshift({ x: tipX, y: tipY });
            trail.pop();
        }

        if (visible || hasBursts || trail[0].x > -900) {
            if (visible) {
                tipX = lerp(tipX, mx, LERP);
                tipY = lerp(tipY, my, LERP);
                trail.unshift({ x: tipX, y: tipY });
                trail.pop();
            }

            /* ── Trail dots ── */
            ctx.shadowBlur = 0;
            for (var i = 0; i < TAIL; i++) {
                var p = trail[i];
                if (p.x < -900) continue;

                var age   = i / TAIL;
                var alpha = (1 - age) * (1 - age) * (isTouch ? 0.85 : 0.75);
                var dotR  = (1 - age) * (isTouch ? 6.0 : (hovering ? 5.5 : 4.0));

                if (alpha < 0.02 || dotR < 0.3) continue;

                /* Aquamarine: tip = bright #00FFD1 (0,255,209) → tail = deep teal (0,150,120) */
                var r = Math.round(0);
                var g = Math.round(255 - (age * 105));   /* 255 → 150 */
                var b = Math.round(209 - (age * 89));    /* 209 → 120 */

                ctx.beginPath();
                ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
                ctx.fill();
            }

            /* ── Glowing head (only while finger/mouse is active) ── */
            if (visible && mx > -900) {
                var headColor  = hovering ? 'rgba(180,220,255,0.95)' : 'rgba(255,255,255,0.95)';
                var glowColor  = hovering ? 'rgba(120,180,255,1)'    : 'rgba(0, 255, 209,1)';
                var ringTarget = hovering ? 1.6 : 1.0;
                ringScale = lerp(ringScale, ringTarget, 0.12);

                var baseRing = (isTouch ? 16 : 11) * ringScale;
                var pulse    = Math.sin(tick * 3.5) * 2;

                ctx.beginPath();
                ctx.arc(mx, my, baseRing + pulse, 0, Math.PI * 2);
                ctx.strokeStyle = hovering ? 'rgba(140,200,255,0.55)' : 'rgba(0, 255, 209,0.45)';
                ctx.lineWidth   = hovering ? 1.8 : 1.5;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur  = hovering ? 20 : 16;
                ctx.stroke();
                ctx.shadowBlur  = 0;

                ctx.beginPath();
                ctx.arc(mx, my, isTouch ? 5 : 3.5, 0, Math.PI * 2);
                ctx.fillStyle   = headColor;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur  = 18;
                ctx.fill();
                ctx.shadowBlur  = 0;

                ctx.beginPath();
                ctx.arc(mx, my, 1.4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        }

        /* ── Tap / click bursts ── */
        for (var b = bursts.length - 1; b >= 0; b--) {
            var burst = bursts[b];
            burst.life -= isTouch ? 0.05 : 0.07; /* slower fade on touch */
            if (burst.life <= 0) { bursts.splice(b, 1); continue; }

            var bl = burst.life;
            var br = (1 - bl) * (isTouch ? 48 : 38);

            ctx.save();
            ctx.translate(burst.x, burst.y);
            ctx.shadowColor = 'rgba(0, 255, 209,0.8)';
            ctx.shadowBlur  = 14 * bl;

            var arms = [[0, -br], [br, 0], [0, br], [-br, 0]];
            for (var a = 0; a < arms.length; a++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(arms[a][0], arms[a][1]);
                ctx.strokeStyle = 'rgba(0, 255, 209,' + (bl * 0.9) + ')';
                ctx.lineWidth   = (isTouch ? 3 : 2) * bl;
                ctx.lineCap     = 'round';
                ctx.stroke();
            }

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

            ctx.beginPath();
            ctx.arc(0, 0, (isTouch ? 6 : 4.5) * bl, 0, Math.PI * 2);
            ctx.fillStyle  = 'rgba(255,255,255,' + bl + ')';
            ctx.shadowBlur = 18 * bl;
            ctx.fill();

            ctx.restore();
        }
    }

    loop();

}());
