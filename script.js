(function() {
    'use strict';

    window.__app = window.__app || {};

    const config = {
        headerSelector: '.navbar',
        burgerToggle: '.navbar-toggler',
        navCollapse: '#navbarNav',
        formSelector: 'form',
        scrollOffset: 100,
        animationDuration: 600,
        debounceDelay: 250
    };

    const patterns = {
        email: /^[^s@]+@[^s@]+.[^s@]+$/,
        phone: /^[ds+-()]{10,20}$/,
        name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        text: /^.{10,1000}$/
    };

    const errorMessages = {
        required: 'Dieses Feld ist erforderlich',
        email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        phone: 'Bitte geben Sie eine gültige Telefonnummer ein',
        name: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen)',
        message: 'Bitte geben Sie mindestens 10 Zeichen ein',
        privacy: 'Sie müssen die Datenschutzerklärung akzeptieren'
    };

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    class BurgerMenu {
        constructor() {
            this.toggle = document.querySelector(config.burgerToggle);
            this.collapse = document.querySelector(config.navCollapse);
            this.navbar = document.querySelector(config.headerSelector);
            this.isOpen = false;

            if (this.toggle && this.collapse) {
                this.init();
            }
        }

        init() {
            this.toggle.addEventListener('click', (e) => this.handleToggle(e));
            document.addEventListener('click', (e) => this.handleOutsideClick(e));
            document.addEventListener('keydown', (e) => this.handleEscape(e));
            window.addEventListener('resize', debounce(() => this.handleResize(), config.debounceDelay));

            const links = this.collapse.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
        }

        handleToggle(e) {
            e.preventDefault();
            e.stopPropagation();
            this.isOpen ? this.close() : this.open();
        }

        open() {
            this.isOpen = true;
            this.collapse.classList.add('show');
            this.toggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            
            this.collapse.style.height = `calc(100vh - ${this.navbar.offsetHeight}px)`;
        }

        close() {
            this.isOpen = false;
            this.collapse.classList.remove('show');
            this.toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        handleOutsideClick(e) {
            if (this.isOpen && !this.navbar.contains(e.target)) {
                this.close();
            }
        }

        handleEscape(e) {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.toggle.focus();
            }
        }

        handleResize() {
            if (window.innerWidth >= 1024 && this.isOpen) {
                this.close();
            }
        }
    }

    class ScrollSpy {
        constructor() {
            this.sections = document.querySelectorAll('[id^="section-"]');
            this.navLinks = document.querySelectorAll('.nav-link[href^="#section-"]');
            this.headerHeight = document.querySelector(config.headerSelector)?.offsetHeight || 72;

            if (this.sections.length > 0 && this.navLinks.length > 0) {
                this.init();
            }
        }

        init() {
            window.addEventListener('scroll', throttle(() => this.updateActive(), 100));
            this.updateActive();
        }

        updateActive() {
            const scrollPos = window.scrollY + this.headerHeight + 50;

            this.sections.forEach(section => {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < bottom) {
                    this.navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }
    }

    class SmoothScroll {
        constructor() {
            this.headerHeight = document.querySelector(config.headerSelector)?.offsetHeight || 72;
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const anchor = e.target.closest('a[href^="#"]');
                if (!anchor) return;

                const href = anchor.getAttribute('href');
                if (href === '#' || href === '#!') return;

                const targetId = href.replace('#', '');
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();
                    const targetPosition = target.offsetTop - this.headerHeight;
                    
                    window.scrollTo({
                        top: Math.max(0, targetPosition),
                        behavior: 'smooth'
                    });
                }
            });
        }
    }

    class FormValidator {
        constructor() {
            this.forms = document.querySelectorAll(config.formSelector);
            if (this.forms.length > 0) {
                this.init();
            }
        }

        init() {
            this.forms.forEach(form => {
                form.addEventListener('submit', (e) => this.handleSubmit(e));

                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => this.clearError(input));
                });
            });
        }

        handleSubmit(e) {
            e.preventDefault();
            e.stopPropagation();

            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            const isValid = this.validateForm(form);

            if (!isValid) {
                return;
            }

            this.disableButton(submitBtn);
            this.submitForm(form, submitBtn);
        }

        validateForm(form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            let isValid = true;

            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        validateField(field) {
            const value = field.value.trim();
            const type = field.type;
            const id = field.id;
            const required = field.hasAttribute('required');

            this.clearError(field);

            if (required && !value) {
                this.showError(field, errorMessages.required);
                return false;
            }

            if (!value && !required) {
                return true;
            }

            if (type === 'email' || id === 'email') {
                if (!patterns.email.test(value)) {
                    this.showError(field, errorMessages.email);
                    return false;
                }
            }

            if (type === 'tel' || id === 'phone') {
                if (!patterns.phone.test(value)) {
                    this.showError(field, errorMessages.phone);
                    return false;
                }
            }

            if (id === 'name' || id === 'firstName' || id === 'lastName') {
                if (!patterns.name.test(value)) {
                    this.showError(field, errorMessages.name);
                    return false;
                }
            }

            if (id === 'message' && value.length < 10) {
                this.showError(field, errorMessages.message);
                return false;
            }

            if (type === 'checkbox' && required && !field.checked) {
                this.showError(field, errorMessages.privacy);
                return false;
            }

            return true;
        }

        showError(field, message) {
            field.classList.add('is-invalid');
            
            let errorDiv = field.parentElement.querySelector('.invalid-feedback');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                field.parentElement.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
        }

        clearError(field) {
            field.classList.remove('is-invalid');
            const errorDiv = field.parentElement.querySelector('.invalid-feedback');
            if (errorDiv) {
                errorDiv.textContent = '';
            }
        }

        disableButton(btn) {
            if (!btn) return;
            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.dataset.originalText = originalText;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';
        }

        enableButton(btn) {
            if (!btn) return;
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || 'Senden';
        }

        submitForm(form, submitBtn) {
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }

            setTimeout(() => {
                this.enableButton(submitBtn);
                window.location.href = 'thank_you.html';
            }, 1000);
        }
    }

    class IntersectionAnimator {
        constructor() {
            this.elements = document.querySelectorAll('.card, .c-media-card, .c-trust-badge, .c-button, img, .form-control');
            if (this.elements.length > 0) {
                this.init();
            }
        }

        init() {
            const options = {
                root: null,
                rootMargin: '0px 0px -100px 0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, options);

            this.elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                el.style.transitionDelay = `${index * 0.05}s`;
                observer.observe(el);
            });
        }

        animateElement(element) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    }

    class HoverEffects {
        constructor() {
            this.init();
        }

        init() {
            this.addButtonEffects();
            this.addCardEffects();
            this.addLinkEffects();
        }

        addButtonEffects() {
            const buttons = document.querySelectorAll('.btn, .c-button');
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
                btn.addEventListener('mousedown', function() {
                    this.style.transform = 'translateY(0) scale(0.98)';
                });
                btn.addEventListener('mouseup', function() {
                    this.style.transform = 'translateY(-2px) scale(1)';
                });
            });
        }

        addCardEffects() {
            const cards = document.querySelectorAll('.card, .c-media-card, .c-trust-badge');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px)';
                    this.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.2)';
                });
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });
            });
        }

        addLinkEffects() {
            const links = document.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateX(4px)';
                });
                link.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateX(0)';
                });
            });
        }
    }

    class LazyLoadSetup {
        constructor() {
            this.init();
        }

        init() {
            const images = document.querySelectorAll('img:not([loading])');
            images.forEach(img => {
                if (!img.classList.contains('c-logo__img')) {
                    img.setAttribute('loading', 'lazy');
                }
            });

            const videos = document.querySelectorAll('video:not([loading])');
            videos.forEach(video => {
                video.setAttribute('loading', 'lazy');
            });
        }
    }

    class ScrollToTop {
        constructor() {
            this.button = this.createButton();
            this.init();
        }

        createButton() {
            const btn = document.createElement('button');
            btn.innerHTML = '↑';
            btn.setAttribute('aria-label', 'Zurück nach oben');
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background-color: var(--color-primary);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease-in-out;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
            `;
            document.body.appendChild(btn);
            return btn;
        }

        init() {
            window.addEventListener('scroll', throttle(() => {
                if (window.scrollY > 300) {
                    this.button.style.opacity = '1';
                    this.button.style.visibility = 'visible';
                } else {
                    this.button.style.opacity = '0';
                    this.button.style.visibility = 'hidden';
                }
            }, 100));

            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            this.button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.1)';
                this.style.boxShadow = '0 8px 20px rgba(0, 102, 255, 0.4)';
            });

            this.button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 4px 12px rgba(0, 102, 255, 0.3)';
            });
        }
    }

    class CountUpAnimator {
        constructor() {
            this.numbers = document.querySelectorAll('[data-count]');
            if (this.numbers.length > 0) {
                this.init();
            }
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.animated) {
                        this.animateCount(entry.target);
                        entry.target.dataset.animated = 'true';
                    }
                });
            }, { threshold: 0.5 });

            this.numbers.forEach(num => observer.observe(num));
        }

        animateCount(element) {
            const target = parseInt(element.dataset.count);
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }
    }

    class ModalManager {
        constructor() {
            this.init();
        }

        init() {
            const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
            privacyLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.getAttribute('href') === '#privacy-modal') {
                        e.preventDefault();
                        this.openModal();
                    }
                });
            });
        }

        openModal() {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
                z-index: 1020;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.3s ease-out;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                padding: 40px;
                position: relative;
                animation: slideUp 0.3s ease-out;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            `;

            modal.innerHTML = `
                <h2 style="margin-bottom: 20px;">Datenschutzerklärung</h2>
                <p>Bitte lesen Sie unsere vollständige Datenschutzerklärung auf der entsprechenden Seite.</p>
                <button style="
                    margin-top: 30px;
                    padding: 12px 24px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Schließen</button>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            const closeBtn = modal.querySelector('button');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    document.body.style.overflow = '';
                }
            });
        }
    }

    function addRippleEffect() {
        const buttons = document.querySelectorAll('.btn, .c-button');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    left: ${x}px;
                    top: ${y}px;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        if (window.__app.initialized) return;
        window.__app.initialized = true;

        new BurgerMenu();
        new ScrollSpy();
        new SmoothScroll();
        new FormValidator();
        new IntersectionAnimator();
        new HoverEffects();
        new LazyLoadSetup();
        new ScrollToTop();
        new CountUpAnimator();
        new ModalManager();
        addRippleEffect();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
