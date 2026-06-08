let revealObserver;

export function initRevealObserver() {
    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        observeRevealElements();
    } else {
        document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
    }
}

export function observeRevealElements() {
    if (!revealObserver) return;
    document.querySelectorAll('[data-reveal]:not(.revealed)').forEach(el => revealObserver.observe(el));
}
