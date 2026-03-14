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

    // Only set first-touch cookie if it doesn't exist
    if (!getCookie('cw_first_touch')) {
        const params = new URLSearchParams(window.location.search);
        const trackingData = {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_content: params.get('utm_content') || '',
            utm_term: params.get('utm_term') || '',
            referrer: document.referrer || '',
            landing_page: window.location.href
        };
        setCookie('cw_first_touch', JSON.stringify(trackingData), 30); // 30 days
    }
})();

// Mobile Menu — full-screen Giga style
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

// FAQ Accordion
document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
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

// ═══ RANDOM AURORA ANIMATION ═══
(function() {
    var blobs = document.querySelectorAll('.aurora-blob');
    if (!blobs.length) return;

    blobs.forEach(function(blob) {
        blob.style.position = 'absolute';
        blob.style.opacity = '0';
        blob.style.transition = 'none';
        moveBlob(blob);
    });

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function moveBlob(blob) {
        // Random position
        var x = rand(-10, 85);
        var y = rand(-10, 80);
        // Random opacity — often invisible, sometimes bright
        var shouldShow = Math.random() > 0.4;
        var opacity = shouldShow ? rand(0.15, 0.45) : 0;
        // Random duration for this step
        var duration = rand(2000, 6000);

        blob.style.transition = 'left ' + duration + 'ms ease-in-out, top ' + duration + 'ms ease-in-out, opacity ' + (duration * 0.7) + 'ms ease-in-out';
        blob.style.left = x + '%';
        blob.style.top = y + '%';
        blob.style.opacity = opacity;

        // Schedule next random move
        setTimeout(function() { moveBlob(blob); }, duration + rand(500, 3000));
    }
})();

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
        timer = setInterval(next, 5000);
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