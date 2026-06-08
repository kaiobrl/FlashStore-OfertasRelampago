import { COUNTDOWN_KEY } from './constants.js';

export function initCountdown() {
    let deadline = parseInt(localStorage.getItem(COUNTDOWN_KEY), 10);
    if (!deadline || deadline < Date.now()) {
        deadline = Date.now() + (17 * 60 + 31) * 1000;
        localStorage.setItem(COUNTDOWN_KEY, deadline);
    }

    const el = document.getElementById('countdown-display');
    if (!el) return;

    const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    
    function updateCountdown() {
        const remaining = Math.max(0, Math.floor((Number(deadline) - Date.now()) / 1000));
        el.textContent = fmt(remaining);
        if (remaining <= 0) {
            clearInterval(tick);
        }
    }

    updateCountdown();
    const tick = setInterval(updateCountdown, 1000);
}
