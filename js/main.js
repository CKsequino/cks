/**
 * main.js — Portfolio interactivity
 * Features: typing effect, scroll progress, stats counter,
 *           active nav, scroll reveal, project filter,
 *           skill bars, form validation, toast, back-to-top
 */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════
       1. SCROLL PROGRESS BAR
    ═══════════════════════════════════════════════ */
    const progressBar = document.getElementById('scroll-progress');

    function updateProgress() {
        if (!progressBar) return;
        const scrolled  = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = (maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0) + '%';
    }

    /* ═══════════════════════════════════════════════
       2. NAVBAR — scroll class + active link
    ═══════════════════════════════════════════════ */
    const navbar   = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    const sections = Array.from(
        document.querySelectorAll('section[id]')
    );

    function updateNavbar() {
        if (!navbar) return;
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    }

    function updateActiveLink() {
        const scrollMid = window.scrollY + window.innerHeight * 0.4;
        let current = '';

        sections.forEach(function (sec) {
            if (sec.offsetTop <= scrollMid) current = sec.id;
        });

        navLinks.forEach(function (link) {
            const target = link.getAttribute('href').slice(1);
            link.classList.toggle('active', target === current);
        });
    }

    /* ═══════════════════════════════════════════════
       3. TYPING EFFECT
    ═══════════════════════════════════════════════ */
    const typingEl = document.getElementById('typing-text');
    const phrases  = [
        'Software Developer',
        'Mobile App Developer',
        'Web Developer',
        'UI/UX Designer',
        'Software Engineering Intern',
    ];

    let phraseIdx  = 0;
    let charIdx    = 0;
    let isDeleting = false;
    let typingTimer;

    function type() {
        if (!typingEl) return;

        const current = phrases[phraseIdx];

        if (!isDeleting) {
            typingEl.textContent = current.slice(0, ++charIdx);
            if (charIdx === current.length) {
                isDeleting = true;
                typingTimer = setTimeout(type, 1200);
                return;
            }
        } else {
            typingEl.textContent = current.slice(0, --charIdx);
            if (charIdx === 0) {
                isDeleting = false;
                phraseIdx  = (phraseIdx + 1) % phrases.length;
                typingTimer = setTimeout(type, 200);
                return;
            }
        }

        typingTimer = setTimeout(type, isDeleting ? 55 : 90);
    }

    /* ═══════════════════════════════════════════════
       4. STATS COUNTER
    ═══════════════════════════════════════════════ */
    const statEls    = document.querySelectorAll('.stat-number[data-target]');
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;

        const statsBar = document.querySelector('.stats-bar');
        if (!statsBar) return;

        const rect = statsBar.getBoundingClientRect();
        if (rect.top > window.innerHeight) return;

        statsAnimated = true;

        statEls.forEach(function (el) {
            const target   = parseInt(el.dataset.target, 10);
            const duration = 1600;
            const start    = performance.now();
            // Cache the suffix element if present
            const suffix   = el.querySelector('.stat-suffix');

            function step(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const num   = Math.round(eased * target);
                if (suffix) {
                    el.firstChild.textContent = num;
                } else {
                    el.textContent = num;
                }
                if (progress < 1) requestAnimationFrame(step);
                else {
                    if (suffix) el.firstChild.textContent = target;
                    else el.textContent = target;
                }
            }

            requestAnimationFrame(step);
        });
    }

    /* ═══════════════════════════════════════════════
       5. SCROLL REVEAL
    ═══════════════════════════════════════════════ */
    const revealEls = document.querySelectorAll('.reveal, .reveal-left');

    const revealObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach(function (el) { revealObserver.observe(el); });

    // Expose so the review system can register dynamically added cards
    window.revealObserver = revealObserver;

    /* ═══════════════════════════════════════════════
       6. SKILL BARS
    ═══════════════════════════════════════════════ */
    const skillFills = document.querySelectorAll('.skill-bar-fill');

    const skillObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const fill   = entry.target;
                    const target = fill.dataset.width || '0';
                    fill.style.width = target + '%';
                    skillObserver.unobserve(fill);
                }
            });
        },
        { threshold: 0.5 }
    );

    skillFills.forEach(function (el) { skillObserver.observe(el); });

    /* ═══════════════════════════════════════════════
       7. PROJECT FILTER
    ═══════════════════════════════════════════════ */
    const filterBtns  = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card[data-category]');

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            const category = btn.dataset.filter;

            projectCards.forEach(function (card) {
                const match = category === 'all' || card.dataset.category === category;
                /* Get the parent col wrapper */
                const col = card.closest('[class*="col-"]') || card.parentElement;

                col.style.transition = 'opacity 0.3s ease';

                if (match) {
                    col.style.display = '';
                    requestAnimationFrame(function () {
                        col.style.opacity = '1';
                    });
                } else {
                    col.style.opacity = '0';
                    setTimeout(function () {
                        col.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    /* ═══════════════════════════════════════════════
       8. CONTACT FORM — validation + toast
    ═══════════════════════════════════════════════ */
    const contactForm = document.getElementById('contactForm');
    const toast       = document.getElementById('toast');

    function showToast(msg, icon) {
        if (!toast) return;
        toast.querySelector('.toast-icon').textContent  = icon || '✅';
        toast.querySelector('.toast-body').textContent  = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 4000);
    }

    // Expose for use by other modules (e.g. review system)
    window.showToast = showToast;

    function validateField(input) {
        const wrapper = input.closest('.form-group');
        if (!wrapper) return true;
        const errEl = wrapper.querySelector('.form-error');
        const valid = input.checkValidity() && input.value.trim() !== '';
        input.classList.toggle('error', !valid);
        if (errEl) errEl.classList.toggle('visible', !valid);
        return valid;
    }

    if (contactForm) {
        // Live validation on blur
        contactForm.querySelectorAll('.form-control').forEach(function (input) {
            input.addEventListener('blur', function () { validateField(input); });
            input.addEventListener('input', function () {
                if (input.classList.contains('error')) validateField(input);
            });
        });

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let allValid = true;
            contactForm.querySelectorAll('.form-control').forEach(function (input) {
                if (!validateField(input)) allValid = false;
            });
            if (!allValid) return;

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;flex-shrink:0"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg> Sending…';
            btn.disabled = true;

            setTimeout(function () {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                contactForm.reset();
                showToast('Message sent! I\'ll get back to you soon.', '✅');
            }, 600);
        });
    }

    /* ═══════════════════════════════════════════════
       9. SMOOTH SCROLL for anchor links
    ═══════════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = 80;
            window.scrollTo({
                top: target.offsetTop - offset,
                behavior: 'smooth',
            });
        });
    });

    /* ═══════════════════════════════════════════════
       10. BACK TO TOP BUTTON
    ═══════════════════════════════════════════════ */
    const backToTop = document.getElementById('back-to-top');
    const scrollInd = document.querySelector('.scroll-indicator');

    function updateBackToTop() {
        if (!backToTop) return;
        backToTop.classList.toggle('visible', window.scrollY > 400);
    }

    function updateScrollIndicator() {
        if (!scrollInd) return;
        scrollInd.classList.toggle('hidden', window.scrollY > 80);
    }

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ═══════════════════════════════════════════════
       11. DOWNLOAD RESUME
    ═══════════════════════════════════════════════ */
    const resumeBtn = document.getElementById('downloadResume');

    if (resumeBtn) {
        resumeBtn.addEventListener('click', function (e) {
            e.preventDefault();

            const content = [
                'CLARK KENT A. SEQUIÑO',
                '='.repeat(52),
                '09319106654  |  clarkkentsequino269@gmail.com  |  github.com/clarkky736',
                '',
                'PROFESSIONAL SUMMARY',
                '--------------------',
                'Analytical and critical thinker Bachelor of Science in Information',
                'Technology graduate with internship experience in software engineering',
                'tasks, application development, web development, API integration,',
                'backend support, frontend development, and UI/UX design. Committed',
                'to applying technical expertise, problem-solving abilities, and',
                'attention to detail to develop reliable, user-centered solutions that',
                'enhance user experience, improve system quality, and support',
                'organizational objectives.',
                '',
                'EDUCATION',
                '---------',
                'Bachelor of Science in Information Technology',
                'August 2022 – June 2026  |  Agujo Daanbantayan, Cebu',
                '',
                'WORK EXPERIENCE',
                '---------------',
                'Software Engineer  |  February 2026 – June 2026',
                '• Developed and maintained mobile application features using modern',
                '  development tools and frameworks.',
                '• Assisted in implementing REST API integrations to support',
                '  application functionality.',
                '• Performed software testing, debugging, and issue resolution to',
                '  improve system reliability.',
                '• Supported backend development by managing and optimizing MySQL',
                '  databases.',
                '• Collaborated with developers during system development and deployment.',
                '• Participated in code reviews and documentation of technical processes.',
                '• Contributed to improving application performance and user experience.',
                '',
                'PROJECTS',
                '--------',
                'NorthPoint Fitness Gym Membership Management',
                '• Designed and developed a web-based membership management system.',
                '• Conducted client interviews and gathered business requirements.',
                '• Developed modules for member registration, payment tracking,',
                '  and reporting.',
                '• Created responsive user interfaces to improve usability.',
                '• Assisted in system testing and deployment.',
                '• Conducted surveys to support the study.',
                '',
                'Container Location Management',
                '• Collaborated with the project owner to gather and analyze',
                '  system requirements.',
                '• Designed the mobile application architecture and database structure.',
                '• Developed backend APIs and integrated frontend components.',
                '• Performed debugging and testing to ensure system stability.',
                '• Improved application workflow and user experience through',
                '  iterative enhancements.',
                '',
                'SKILLS',
                '------',
                'Proficient in HTML, CSS, JavaScript, Flutter, Angular, and Node.js,',
                'with experience in developing applications and performing CRUD',
                'operations. Knowledgeable in MySQL database management and familiar',
                'with version control using Git and GitHub Desktop. Skilled in using',
                'development tools such as Visual Studio 2022, Visual Studio Code,',
                'Android Studio, and XAMPP. Demonstrates strong problem-solving',
                'abilities, attention to detail, teamwork, adaptability, effective',
                'time management, and a willingness to continuously learn and improve.',
                '',
                '─'.repeat(52),
                'Generated: ' + new Date().toLocaleDateString(),
            ].join('\n');

            const blob = new Blob([content], { type: 'text/plain' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'ClarkKentSequino_Resume_SoftwareDeveloper.txt';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();

            showToast('Resume downloaded!', '📄');
        });
    }

    /* ═══════════════════════════════════════════════
       12. NAVBAR MOBILE — close menu on link click
    ═══════════════════════════════════════════════ */
    const navbarCollapse = document.getElementById('navbarNav');

    if (navbarCollapse) {
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                if (navbarCollapse.classList.contains('show')) {
                    const toggler = document.querySelector('.navbar-toggler');
                    if (toggler) toggler.click();
                }
            });
        });
    }

    /* ═══════════════════════════════════════════════
       13. UNIFIED SCROLL HANDLER
    ═══════════════════════════════════════════════ */
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(function () {
                updateProgress();
                updateNavbar();
                updateActiveLink();
                updateBackToTop();
                animateStats();
                ticking = false;
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* ═══════════════════════════════════════════════
       14. INIT
    ═══════════════════════════════════════════════ */
    updateNavbar();
    updateActiveLink();
    updateBackToTop();
    updateProgress();

    // Kick off typing immediately
    setTimeout(type, 150);

})();

/* ═══════════════════════════════════════════════
   15. REVIEW SYSTEM — star picker, localStorage, render
═══════════════════════════════════════════════ */
(function () {
    'use strict';

    var STORAGE_KEY   = 'clark_reviews';
    var reviewForm    = document.getElementById('reviewForm');
    var reviewsGrid   = document.getElementById('reviews-grid');
    var starPicker    = document.getElementById('starPicker');
    var ratingInput   = document.getElementById('reviewRating');
    var ratingError   = document.getElementById('ratingError');
    var nameInput     = document.getElementById('reviewName');
    var roleInput     = document.getElementById('reviewRole');
    var textInput     = document.getElementById('reviewText');
    var submitBtn     = document.getElementById('submitReviewBtn');

    if (!reviewForm || !reviewsGrid || !starPicker) return;

    /* ── Helpers ─────────────────────────────── */

    function getReviews() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveReviews(reviews) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    }

    function getInitials(name) {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(function (w) { return w[0].toUpperCase(); })
            .join('');
    }

    function buildStars(rating) {
        var filled = '★'.repeat(rating);
        var empty  = '☆'.repeat(5 - rating);
        return filled + empty;
    }

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(iso) {
        var d = new Date(iso);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /* ── Build a review card DOM node ───────── */

    function createReviewCard(review) {
        var col  = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        var initials = getInitials(review.name);
        var roleHTML = review.role
            ? '<div class="author-role">' + escapeHTML(review.role) + '</div>'
            : '';

        col.innerHTML =
            '<div class="testimonial-card dynamic">' +
                '<div class="review-badge">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
                        '<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>' +
                    '</svg>' +
                    'Verified Review · ' + escapeHTML(formatDate(review.date)) +
                '</div>' +
                '<div class="stars">' + buildStars(review.rating) + '</div>' +
                '<div class="testimonial-quote">"</div>' +
                '<p class="testimonial-text">' + escapeHTML(review.text) + '</p>' +
                '<div class="testimonial-author">' +
                    '<div class="author-avatar">' + escapeHTML(initials) + '</div>' +
                    '<div>' +
                        '<div class="author-name">' + escapeHTML(review.name) + '</div>' +
                        roleHTML +
                    '</div>' +
                '</div>' +
            '</div>';

        return col;
    }

    /* ── Load and render all saved reviews ───── */

    function renderSavedReviews() {
        var reviews = getReviews();
        reviews.forEach(function (review) {
            var card = createReviewCard(review);
            // Remove animation for already-saved reviews (no flash on load)
            var inner = card.querySelector('.testimonial-card');
            if (inner) inner.style.animation = 'none';
            reviewsGrid.appendChild(card);
        });
    }

    /* ── Star picker interaction ─────────────── */

    var starBtns    = starPicker.querySelectorAll('.star-btn');
    var currentRating = 0;

    function highlightStars(upTo) {
        starBtns.forEach(function (btn) {
            var val = parseInt(btn.dataset.value, 10);
            btn.classList.toggle('hovered', val <= upTo);
        });
    }

    function selectStars(rating) {
        currentRating = rating;
        ratingInput.value = rating;
        starBtns.forEach(function (btn) {
            var val = parseInt(btn.dataset.value, 10);
            btn.classList.toggle('selected', val <= rating);
            btn.classList.remove('hovered');
        });
        // Hide rating error if now valid
        if (rating > 0) {
            ratingError.classList.remove('visible');
        }
    }

    starBtns.forEach(function (btn) {
        btn.addEventListener('mouseenter', function () {
            highlightStars(parseInt(btn.dataset.value, 10));
        });
        btn.addEventListener('mouseleave', function () {
            highlightStars(currentRating);
        });
        btn.addEventListener('click', function () {
            selectStars(parseInt(btn.dataset.value, 10));
        });
    });

    /* ── Form field validation ───────────────── */

    function validateReviewField(input) {
        var wrapper = input.closest('.form-group');
        if (!wrapper) return true;
        var errEl = wrapper.querySelector('.form-error');
        var valid = input.checkValidity() && input.value.trim() !== '';
        input.classList.toggle('error', !valid);
        if (errEl) errEl.classList.toggle('visible', !valid);
        return valid;
    }

    // Live validation on blur
    [nameInput, textInput].forEach(function (input) {
        if (!input) return;
        input.addEventListener('blur', function () { validateReviewField(input); });
        input.addEventListener('input', function () {
            if (input.classList.contains('error')) validateReviewField(input);
        });
    });

    /* ── Form submit ─────────────────────────── */

    reviewForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var nameValid   = validateReviewField(nameInput);
        var textValid   = validateReviewField(textInput);
        var ratingValid = currentRating > 0;

        if (!ratingValid) {
            ratingError.classList.add('visible');
        }

        if (!nameValid || !textValid || !ratingValid) return;

        // Build review object
        var review = {
            id:     Date.now(),
            name:   nameInput.value.trim(),
            role:   roleInput ? roleInput.value.trim() : '',
            rating: currentRating,
            text:   textInput.value.trim(),
            date:   new Date().toISOString()
        };

        // Persist
        var reviews = getReviews();
        reviews.push(review);
        saveReviews(reviews);

        // Render instantly
        var card = createReviewCard(review);
        reviewsGrid.appendChild(card);

        // Trigger reveal observer on the new card
        var inner = card.querySelector('.testimonial-card');
        if (inner) {
            revealObserver.observe(card.querySelector('.testimonial-card') || card);
        }

        // Reset form
        reviewForm.reset();
        selectStars(0);
        starBtns.forEach(function (btn) {
            btn.classList.remove('selected', 'hovered');
        });
        currentRating = 0;
        ratingInput.value = 0;

        // Show toast
        if (typeof showToast === 'function') {
            showToast('Thanks for your review! It\'s now live.', '⭐');
        }

        // Scroll the new card into view
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    /* ── Init: render any saved reviews on load ─ */
    renderSavedReviews();

}());

/* Skills scroll — handled entirely by CSS, no JS needed */

/* ═══════════════════════════════════════════════
   PREMIUM UPGRADES
   17. Page Loader
   18. Navbar hide/show on scroll
   19. Lightbox
   20. 3D card tilt
═══════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   17. PAGE LOADER
───────────────────────────────────────────── */
(function () {
    'use strict';

    var loader = document.getElementById('page-loader');
    if (!loader) return;

    /* Hide loader once page is fully loaded */
    function dismissLoader() {
        loader.classList.add('hidden');
        /* Remove from DOM after transition so it can't block clicks */
        loader.addEventListener('transitionend', function () {
            loader.remove();
        }, { once: true });
    }

    if (document.readyState === 'complete') {
        /* Already loaded — short delay so the bar animation plays */
        setTimeout(dismissLoader, 400);
    } else {
        window.addEventListener('load', function () {
            setTimeout(dismissLoader, 300);
        });
    }
}());

/* ─────────────────────────────────────────────
   18. NAVBAR HIDE ON SCROLL DOWN / SHOW ON SCROLL UP
───────────────────────────────────────────── */
(function () {
    'use strict';

    var navbar     = document.querySelector('.navbar');
    if (!navbar) return;

    var lastY      = 0;
    var threshold  = 80;   /* px from top before hide/show kicks in */
    var ticking    = false;

    function handleNavbar() {
        var currentY = window.scrollY;

        if (currentY < threshold) {
            /* Near top — always show */
            navbar.classList.remove('nav-hidden');
            navbar.classList.add('nav-visible');
        } else if (currentY > lastY + 8) {
            /* Scrolling DOWN — hide */
            navbar.classList.add('nav-hidden');
            navbar.classList.remove('nav-visible');
            /* Also close any open mobile menu */
            var collapse = document.getElementById('navbarNav');
            if (collapse && collapse.classList.contains('show')) {
                var toggler = document.querySelector('.navbar-toggler');
                if (toggler) toggler.click();
            }
        } else if (currentY < lastY - 4) {
            /* Scrolling UP — show */
            navbar.classList.remove('nav-hidden');
            navbar.classList.add('nav-visible');
        }

        lastY    = currentY;
        ticking  = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(handleNavbar);
            ticking = true;
        }
    }, { passive: true });
}());

/* ─────────────────────────────────────────────
   19. LIGHTBOX
───────────────────────────────────────────── */
(function () {
    'use strict';

    var lightbox  = document.getElementById('lightbox');
    var lbImg     = document.getElementById('lightboxImg');
    var lbCaption = document.getElementById('lightboxCaption');
    var lbCounter = document.getElementById('lightboxCounter');
    var lbClose   = document.getElementById('lightboxClose');
    var lbPrev    = document.getElementById('lightboxPrev');
    var lbNext    = document.getElementById('lightboxNext');
    var lbDots    = document.getElementById('lightboxDots');

    if (!lightbox || !lbImg) return;

    var images  = [];
    var current = 0;

    /* ── Open ── */
    function open(imgs, startIndex, title) {
        images  = imgs;
        current = startIndex || 0;

        buildDots();
        show(current);

        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
        lbClose.focus();
    }

    /* ── Close ── */
    function close() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        /* Clear src after transition so there's no flash on next open */
        setTimeout(function () { lbImg.src = ''; }, 350);
    }

    /* ── Show slide ── */
    function show(index) {
        current = Math.max(0, Math.min(index, images.length - 1));

        /* Fade out → swap src → fade in */
        lbImg.style.opacity = '0';
        lbImg.style.transform = 'scale(0.96)';

        setTimeout(function () {
            lbImg.src = images[current];
            lbImg.alt = lbCaption ? lbCaption.textContent : '';
            lbImg.style.opacity    = '1';
            lbImg.style.transform  = 'scale(1)';
            lbImg.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        }, 180);

        /* Caption / counter */
        if (lbCaption) lbCaption.textContent = '';
        if (lbCounter) {
            lbCounter.textContent = images.length > 1
                ? (current + 1) + ' / ' + images.length
                : '';
        }

        /* Arrows */
        if (lbPrev) lbPrev.classList.toggle('hidden', current === 0);
        if (lbNext) lbNext.classList.toggle('hidden', current === images.length - 1);

        /* Dots */
        var dots = lbDots ? lbDots.querySelectorAll('.lightbox-dot') : [];
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
    }

    /* ── Build dots ── */
    function buildDots() {
        if (!lbDots) return;
        lbDots.innerHTML = '';
        if (images.length <= 1) return;
        images.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className   = 'lightbox-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Image ' + (i + 1));
            dot.addEventListener('click', function () { show(i); });
            lbDots.appendChild(dot);
        });
    }

    /* ── Wire triggers on all .project-img[data-gallery] ── */
    function bindTriggers() {
        document.querySelectorAll('.project-img[data-gallery]').forEach(function (el) {
            /* Remove any old listener by cloning */
            var fresh = el.cloneNode(true);
            el.parentNode.replaceChild(fresh, el);

            fresh.addEventListener('click', function () {
                var raw   = fresh.getAttribute('data-gallery');
                var title = fresh.getAttribute('data-title') || '';
                var imgs  = [];
                try { imgs = JSON.parse(raw); } catch (e) { imgs = []; }
                if (!imgs.length) return;
                if (lbCaption) lbCaption.textContent = title;
                open(imgs, 0, title);
            });
        });
    }

    bindTriggers();

    /* ── Controls ── */
    if (lbClose) lbClose.addEventListener('click', close);
    if (lbPrev)  lbPrev.addEventListener('click',  function () { show(current - 1); });
    if (lbNext)  lbNext.addEventListener('click',  function () { show(current + 1); });

    /* Click backdrop to close */
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) close();
    });

    /* Keyboard: Esc / arrows */
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape')     close();
        if (e.key === 'ArrowLeft')  show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });

    /* Touch swipe inside lightbox */
    var lbTouchX = 0;
    lightbox.addEventListener('touchstart', function (e) {
        lbTouchX = e.touches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - lbTouchX;
        if (Math.abs(dx) > 40) {
            if (dx < 0) show(current + 1);
            else        show(current - 1);
        }
    }, { passive: true });

}());

/* ─────────────────────────────────────────────
   20. 3D CARD TILT
   Applies to all elements with .tilt-card
   Disabled on touch devices and reduced-motion
───────────────────────────────────────────── */
(function () {
    'use strict';

    /* Skip on touch-only or reduced-motion */
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    /* Skip on small screens — tilt looks wrong on narrow viewports */
    if (window.innerWidth <= 991) return;

    var MAX_TILT   = 8;    /* max degrees */
    var MAX_LIFT   = 12;   /* px translateZ */
    var SCALE      = 1.03;

    function applyTilt(el, e) {
        var rect   = el.getBoundingClientRect();
        var cx     = rect.left + rect.width  / 2;
        var cy     = rect.top  + rect.height / 2;
        var dx     = (e.clientX - cx) / (rect.width  / 2);
        var dy     = (e.clientY - cy) / (rect.height / 2);
        var rotX   = (-dy * MAX_TILT).toFixed(2);
        var rotY   = ( dx * MAX_TILT).toFixed(2);

        el.style.transform =
            'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) ' +
            'translateZ(' + MAX_LIFT + 'px) scale(' + SCALE + ')';
    }

    function resetTilt(el) {
        el.style.transform = '';
    }

    function bindCard(el) {
        el.addEventListener('mousemove', function (e) {
            requestAnimationFrame(function () { applyTilt(el, e); });
        });
        el.addEventListener('mouseleave', function () {
            resetTilt(el);
        });
    }

    /* Bind existing cards */
    document.querySelectorAll('.tilt-card').forEach(bindCard);

    /* Re-bind if new cards are injected (e.g. reviews) */
    var tiltObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.classList && node.classList.contains('tilt-card')) {
                    bindCard(node);
                }
                node.querySelectorAll && node.querySelectorAll('.tilt-card').forEach(bindCard);
            });
        });
    });

    tiltObserver.observe(document.body, { childList: true, subtree: true });

}());
