/**
 * Sanitize strings to prevent XSS
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Format number to BRL currency
 */
export function formatBRL(value) {
    return 'R$ ' + value.toLocaleString('pt-BR');
}

/**
 * Format relative time for notifications
 */
export function formatNotifTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return mins + 'min atrás';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h atrás';
    const days = Math.floor(hours / 24);
    return days + 'd atrás';
}

/**
 * Debounce function for performance
 */
export function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}
