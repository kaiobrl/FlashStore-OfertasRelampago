import { THEME_KEY } from './constants.js';

export function initTheme() {
    const html = document.documentElement;
    const toggleBtn = document.querySelector('.theme-toggle-header');
    if (!toggleBtn) return;

    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
        html.classList.toggle('dark', saved === 'dark');
    }
    
    toggleBtn.setAttribute('aria-label', html.classList.contains('dark') ? 'Alternar para modo claro' : 'Alternar para modo escuro');
    
    toggleBtn.addEventListener('click', () => {
        const isDark = html.classList.toggle('dark');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        toggleBtn.setAttribute('aria-label', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
    });
}
