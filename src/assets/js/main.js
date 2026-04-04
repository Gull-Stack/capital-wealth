// Lead Source Tracking — UTM params + referrer + landing page (first-touch)
(function() {
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    // Auto-detect source from referrer when no UTMs present
    function detectSource(referrer) {
        if (!referrer) return { source: 'direct', medium: 'none' };
        var r = referrer.toLowerCase();
        if (r.includes('google.com')) return { source: 'google', medium: 'organic' };
        if (r.includes('bing.com')) return { source: 'bing', medium: 'organic' };
        if (r.includes('yahoo.com')) return { source: 'yahoo', medium: 'organic' };
        if (r.includes('duckduckgo.com')) return { source: 'duckduckgo', medium: 'organic' };
        if (r.includes('facebook.com') || r.includes('fb.com')) return { source: 'facebook-organic', medium: 'social' };
        if (r.includes('instagram.com')) return { source: 'instagram', medium: 'social' };
        if (r.includes('linkedin.com')) return { source: 'linkedin', medium: 'social' };
        if (r.includes('twitter.com') || r.includes('t.co') || r.includes('x.com')) return { source: 'twitter', medium: 'social' };
        if (r.includes('youtube.com')) return { source: 'youtube', medium: 'social' };
        if (r.includes('chatgpt.com') || r.includes('openai.com')) return { source: 'chatgpt', medium: 'ai' };
        if (r.includes('perplexity.ai')) return { source: 'perplexity', medium: 'ai' };
        if (r.includes('gemini.google.com')) return { source: 'gemini', medium: 'ai' };
        // Extract domain as referral source
        try { return { source: new URL(referrer).hostname.replace('www.', ''), medium: 'referral' }; } catch(e) {}
        return { source: 'unknown', medium: 'referral' };
    }

    // Only set first-touch cookie if it doesn't exist
    if (!getCookie('cw_first_touch')) {
        var params = new URLSearchParams(window.location.search);
        var hasUtm = params.get('utm_source');
        var detected = detectSource(document.referrer);
        var trackingData = {
            utm_source: params.get('utm_source') || detected.source,
            utm_medium: params.get('utm_medium') || detected.medium,
            utm_campaign: params.get('utm_campaign') || '',
            utm_content: params.get('utm_content') || '',
            utm_term: params.get('utm_term') || '',
            referrer: document.referrer || '',
            landing_page: window.location.href
        };
        setCookie('cw_first_touch', JSON.stringify(trackingData), 30);
    }
})();

// GA4 Event Tracking
(function() {
    if (typeof gtag !== 'function') return;

    // Track phone clicks
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href^="tel:"]');
        if (link) {
            gtag('event', 'phone_click', {
                event_category: 'contact',
                event_label: link.href.replace('tel:', ''),
                value: 1
            });
        }
    });

    // Track email clicks
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a[href^="mailto:"]');
        if (link) {
            gtag('event', 'email_click', {
                event_category: 'contact',
                event_label: link.href.replace('mailto:', ''),
                value: 1
            });
        }
    });

    // Track CTA button clicks
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.titan-hero-btn-primary, .service-process-cta, .service-problem-cta-btn');
        if (btn) {
            gtag('event', 'cta_click', {
                event_category: 'engagement',
                event_label: btn.textContent.trim().substring(0, 50),
                link_url: btn.href || '',
                page_location: window.location.pathname
            });
        }
    });

    // Track form submission (fires on success)
    var form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function() {
            gtag('event', 'generate_lead', {
                event_category: 'conversion',
                event_label: 'consultation_request',
                value: 1
            });
        });
    }

    // Track scroll depth (25%, 50%, 75%, 100%)
    var scrollMarks = { 25: false, 50: false, 75: false, 100: false };
    window.addEventListener('scroll', function() {
        var scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        [25, 50, 75, 100].forEach(function(mark) {
            if (scrollPct >= mark && !scrollMarks[mark]) {
                scrollMarks[mark] = true;
                gtag('event', 'scroll_depth', {
                    event_category: 'engagement',
                    event_label: mark + '%',
                    value: mark
                });
            }
        });
    });
})();

// Mobile Menu — full-screen Giga style
// Align nav dropdown with nav pill left edge
document.addEventListener('DOMContentLoaded', function() {
    const navPill = document.querySelector('.nav-left-pill');
    function setNavLeft() {
        if (navPill) {
            document.documentElement.style.setProperty('--nav-left', navPill.getBoundingClientRect().left + 'px');
        }
    }
    setNavLeft();
    window.addEventListener('resize', setNavLeft);
});

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    function openMenu() {
        mobileMenu.classList.add('active');
        mobileMenuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            if (mobileMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMenu);
        }

        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });
    }
});

// Mobile Services Accordion
document.addEventListener('DOMContentLoaded', function() {
    var toggle = document.getElementById('mobileServicesToggle');
    var panel = document.getElementById('mobileServicesPanel');
    if (toggle && panel) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggle.classList.toggle('active');
            panel.classList.toggle('active');
        });
    }
});

// FAQ Accordion (old + new)
document.addEventListener('DOMContentLoaded', function() {
    // Old style
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
            if (!isActive) faqItem.classList.add('active');
        });
    });
    // New two-column style
    document.querySelectorAll('.faq-acc-item').forEach(item => {
        item.addEventListener('click', function() {
            const isActive = this.classList.contains('active');
            document.querySelectorAll('.faq-acc-item').forEach(i => i.classList.remove('active'));
            if (!isActive) this.classList.add('active');
        });
    });
});

// Smooth Scrolling for Anchor Links
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Scroll Animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate in
    const animatedElements = document.querySelectorAll('.card, .stat, .testimonial, .process-step, .case-study');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
});

// Trust Bar Marquee (if needed for responsiveness)
document.addEventListener('DOMContentLoaded', function() {
    const trustContent = document.querySelector('.trust-content');
    if (trustContent) {
        // Clone content for seamless loop
        const clone = trustContent.cloneNode(true);
        trustContent.parentNode.appendChild(clone);
    }
});

// Form validation (visual only — actual submission handled by page-specific JS)
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('form [required]');
    inputs.forEach(field => {
        field.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    });
});

// Phone Number Formatting
document.addEventListener('DOMContentLoaded', function() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6, 10);
            } else if (value.length >= 3) {
                value = value.substring(0, 3) + '-' + value.substring(3, 6);
            }
            e.target.value = value;
        });
    });
});

// Lazy Loading for Images (if needed)
document.addEventListener('DOMContentLoaded', function() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});

// Header Scroll Effect
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
});

// Aurora removed — clean Titan layout

// ═══ SERVICES CANVAS TABS ═══
(function() {
    var tabs = document.querySelectorAll('.svc-tab');
    var imgs = document.querySelectorAll('.svc-canvas-img');
    if (!tabs.length) return;

    var current = 0;
    var timer;

    function activate(i) {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        imgs.forEach(function(im) { im.classList.remove('active'); });
        tabs[i].classList.add('active');
        imgs[i].classList.add('active');
        current = i;
    }

    function next() {
        activate((current + 1) % tabs.length);
    }

    function startTimer() {
        clearInterval(timer);
        timer = setInterval(next, 8000);
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            activate(parseInt(this.getAttribute('data-svc')));
            startTimer();
        });
    });

    startTimer();
})();

// ═══ TESTIMONIAL CAROUSEL ═══
(function() {
    var photos = document.querySelectorAll('.giga-testimonial-slide-photo');
    var slides = document.querySelectorAll('.giga-testimonial-slide');
    var dots = document.querySelectorAll('.giga-dot');
    if (!photos.length) return;

    var current = 0;
    var total = photos.length;
    var interval;

    function showSlide(i) {
        photos.forEach(function(p) { p.classList.remove('active'); });
        slides.forEach(function(s) { s.classList.remove('active'); });
        dots.forEach(function(d) { d.classList.remove('active'); });
        photos[i].classList.add('active');
        slides[i].classList.add('active');
        dots[i].classList.add('active');
        current = i;
    }

    function next() {
        showSlide((current + 1) % total);
    }

    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            showSlide(parseInt(this.getAttribute('data-index')));
            clearInterval(interval);
            interval = setInterval(next, 6000);
        });
    });

    interval = setInterval(next, 6000);
})();

// Add CSS for form error states
const style = document.createElement('style');
style.textContent = `
    form .error {
        border-color: #ef4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
`;
document.head.appendChild(style);
// Titan nav — flat at top, glass pill on scroll
(function() {
    const nav = document.querySelector('.titan-nav');
    if (!nav) return;
    
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(function() {
                if (window.scrollY > 60) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // check initial state
})();

// Titan reviews carousel
(function() {
    var track = document.querySelector('.titan-reviews-track');
    var cards = document.querySelectorAll('.titan-review-photo-card');
    var prevBtn = document.querySelector('.titan-reviews-prev');
    var nextBtn = document.querySelector('.titan-reviews-next');
    var dotsContainer = document.querySelector('.titan-reviews-dots');
    if (!track || !cards.length || !dotsContainer) return;

    function getPerView() { return window.innerWidth <= 768 ? 1 : 3; }
    var perView = getPerView();
    var totalPages = Math.ceil(cards.length / perView);
    var currentPage = 0;

    function buildDots() {
        dotsContainer.innerHTML = '';
        totalPages = Math.ceil(cards.length / perView);
        for (var i = 0; i < totalPages; i++) {
            var dot = document.createElement('span');
            dot.className = 'titan-reviews-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('data-page', i);
            dot.addEventListener('click', function() { goToPage(parseInt(this.getAttribute('data-page'))); });
            dotsContainer.appendChild(dot);
        }
    }

    function goToPage(page) {
        if (page < 0) page = totalPages - 1;
        if (page >= totalPages) page = 0;
        currentPage = page;
        var card = cards[0];
        var gap = 20; // 1.25rem
        var cardWidth = card.offsetWidth + gap;
        track.style.transform = 'translateX(-' + (currentPage * perView * cardWidth) + 'px)';
        var dots = dotsContainer.querySelectorAll('.titan-reviews-dot');
        dots.forEach(function(d, idx) { d.classList.toggle('active', idx === currentPage); });
    }

    buildDots();
    prevBtn.addEventListener('click', function() { goToPage(currentPage - 1); });
    nextBtn.addEventListener('click', function() { goToPage(currentPage + 1); });

    window.addEventListener('resize', function() {
        perView = getPerView();
        buildDots();
        goToPage(0);
    });

    // Touch/drag support
    var startX = 0, isDragging = false;
    track.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; isDragging = true; }, {passive: true});
    track.addEventListener('mousedown', function(e) { startX = e.clientX; isDragging = true; });
    track.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        var diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { diff > 0 ? goToPage(currentPage + 1) : goToPage(currentPage - 1); }
    });
    track.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;
        var diff = startX - e.clientX;
        if (Math.abs(diff) > 50) { diff > 0 ? goToPage(currentPage + 1) : goToPage(currentPage - 1); }
    });
})();
