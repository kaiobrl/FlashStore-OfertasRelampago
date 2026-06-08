// Prevents flash of unstyled content (FOUC) for dark mode
// Must load synchronously in <head> before CSS is applied
(function() {
    var saved = localStorage.getItem('theme-preference');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
})();
