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

            function step(now) {
                const progress = Math.min((now - start) / duration, 1);
                // Ease-out quad
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target;
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
                card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';

                if (match) {
                    card.style.display  = '';
                    setTimeout(function () {
                        card.style.opacity   = '1';
                        card.style.transform = '';
                    }, 10);
                } else {
                    card.style.opacity   = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(function () {
                        card.style.display = 'none';
                    }, 180);
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
            const originalText = btn.textContent;
            btn.textContent = 'Sending…';
            btn.disabled = true;

            // Simulate async send
            setTimeout(function () {
                btn.textContent = originalText;
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

    function updateBackToTop() {
        if (!backToTop) return;
        backToTop.classList.toggle('visible', window.scrollY > 400);
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
