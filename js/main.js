import { PRODUCTS } from './modules/constants.js';
import { 
    renderProductList, 
    renderProductGrid, 
    renderCart, 
    updateBadge, 
    updateNotifBellBadge, 
    renderNotifPrefs,
    renderNotificationCenter,
    showToast
} from './modules/renderers.js';
import { 
    addToCart, 
    removeFromCart, 
    updateQty, 
    clearCart 
} from './modules/cart.js';
import { 
    markNotifRead, 
    deleteNotification, 
    markAllRead, 
    clearAllNotifications,
    seedDemoNotifications,
    getNotifPrefs,
    saveNotifPrefs,
    addNotification
} from './modules/notifications.js';
import { initTheme } from './modules/theme.js';
import { initCountdown } from './modules/countdown.js';
import { initRevealObserver, observeRevealElements } from './modules/reveal.js';
import { initImageObserver } from './modules/images.js';
import { initPWA } from './modules/pwa.js';
import { initPushNotifications } from './modules/pwa-notifications.js';
import { debounce } from './modules/utils.js';

// ── App State ──
let activeCategory = 'todos';
let searchQuery = '';
let activeSort = 'default';

// ── Tab Switching ──
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const tab = document.getElementById('tab-' + tabId);
    if (tab) tab.classList.add('active');
    
    const navBtn = document.querySelector('.nav-item[data-tab="' + tabId + '"]');
    if (navBtn) navBtn.classList.add('active');
    
    if (tabId === 'carrinho') renderCart(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Filter Logic ──
function getFilteredProducts() {
    let filtered = PRODUCTS;
    if (activeCategory !== 'todos') {
        filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
    }
    
    switch (activeSort) {
        case 'price-asc':
            filtered = [...filtered].sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered = [...filtered].sort((a, b) => b.price - a.price);
            break;
        case 'discount':
            filtered = [...filtered].sort((a, b) => parseInt(a.discount) - parseInt(b.discount));
            break;
        case 'rating':
            filtered = [...filtered].sort((a, b) => b.rating - a.rating);
            break;
    }
    return filtered;
}

function applyFilters() {
    const filtered = getFilteredProducts();
    renderProductGrid(filtered);
    observeRevealElements();
}

// ── Notification Center ──
function openNotificationCenter() {
    document.getElementById('notif-center').classList.add('visible');
    document.getElementById('notif-center-overlay').classList.add('visible');
    document.body.classList.add('no-scroll');
    renderNotificationCenter();
}

function closeNotificationCenter() {
    document.getElementById('notif-center').classList.remove('visible');
    document.getElementById('notif-center-overlay').classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

// ── Event Delegation ──
document.body.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id ? parseInt(target.dataset.id, 10) : null;
    const tab = target.dataset.tab;
    const delta = target.dataset.delta ? parseInt(target.dataset.delta, 10) : null;

    switch (action) {
        case 'switch-tab':            window.switchTab(tab); break;
        case 'add-to-cart':           
            const p = addToCart(id); 
            showToast(p.name.split(' ').slice(0, 3).join(' ') + ' adicionado!');
            target.classList.add('added');
            setTimeout(() => target.classList.remove('added'), 1200);
            break;
        case 'update-qty':            updateQty(id, delta); break;
        case 'remove-from-cart':      removeFromCart(id); break;
        case 'clear-cart':            clearCart(); break;
        case 'checkout':              showToast('Redirecionando para o checkout...'); break;
        case 'mark-notif-read':       markNotifRead(id); break;
        case 'delete-notification':   deleteNotification(id); break;
        case 'toggle-notif-section':  toggleNotifSection(); break;
        case 'send-test-notification': sendTestNotification(); break;
    }
});

// ── Initialize Listeners ──
function initListeners() {
    // Search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            searchQuery = e.target.value.trim();
            applyFilters();
        }, 200));
    }

    // Sort
    const sortSelect = document.getElementById('product-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeSort = e.target.value;
            applyFilters();
        });
    }

    // Category Chips
    const filterChips = document.getElementById('filter-chips');
    if (filterChips) {
        filterChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.dataset.category;
            applyFilters();
        });
    }

    // Notification Center
    document.getElementById('notif-bell-btn')?.addEventListener('click', openNotificationCenter);
    document.getElementById('notif-center-close-btn')?.addEventListener('click', closeNotificationCenter);
    document.getElementById('notif-center-overlay')?.addEventListener('click', closeNotificationCenter);
    document.getElementById('notif-mark-all-btn')?.addEventListener('click', () => {
        markAllRead();
        showToast('Todas marcadas como lidas');
    });
    document.getElementById('notif-clear-all-btn')?.addEventListener('click', () => {
        clearAllNotifications();
        showToast('Notificações limpas');
    });

    // Header Search Button
    document.querySelector('.app-header-actions .icon-btn[aria-label="Buscar produtos"]')?.addEventListener('click', () => {
        window.switchTab('produtos');
        setTimeout(() => document.getElementById('product-search')?.focus(), 300);
    });

    // Global Key Listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeNotificationCenter();
    });

    // Custom Events for State Changes
    window.addEventListener('cart-updated', () => {
        updateBadge();
        renderCart();
    });

    window.addEventListener('notifications-updated', () => {
        updateNotifBellBadge();
        renderNotificationCenter();
    });
}

// ── Actions ──
export function toggleNotifSection() {
    const section = document.getElementById('notif-section');
    if (!section) return;
    section.classList.toggle('notif-section-hidden');
    if (!section.classList.contains('notif-section-hidden')) renderNotifPrefs();
}

export function sendTestNotification() {
    if (Notification.permission === 'granted') {
        new Notification('⚡ Oferta Relâmpago!', {
            body: 'Monitor Triplo Portátil 14" com 52% OFF por R$ 1.199!',
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            tag: 'flash-sale-test'
        });
    } else {
        showToast('Ative as notificações push primeiro');
    }
    addNotification('⚡ Oferta Relâmpago!', 'Monitor Triplo Portátil 14" com 52% OFF por R$ 1.199!', 'flash');
}

// ── App Init ──
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCountdown();
    initRevealObserver();
    initImageObserver();
    initPWA();
    initPushNotifications();
    initListeners();
    initOnlineDetection();
    
    seedDemoNotifications();
    
    renderProductList();
    renderProductGrid();
    updateBadge();
    updateNotifBellBadge();
    observeRevealElements(); // Garante que novos elementos sejam observados
});

// ── Online/Offline Detection ──
function initOnlineDetection() {
    const offlineBanner = document.getElementById('offline-banner');
    const reconnectedBanner = document.getElementById('reconnected-banner');
    let reconnectedTimeout;

    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineBanner?.classList.remove('visible');
            reconnectedBanner?.classList.add('visible');
            clearTimeout(reconnectedTimeout);
            reconnectedTimeout = setTimeout(() => {
                reconnectedBanner?.classList.remove('visible');
            }, 3000);
        } else {
            offlineBanner?.classList.add('visible');
            reconnectedBanner?.classList.remove('visible');
        }
    }

    if (!navigator.onLine) {
        offlineBanner?.classList.add('visible');
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// ── Expose to window for tests and global access ──
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQty = updateQty;
window.clearCart = clearCart;
window.markNotifRead = markNotifRead;
window.deleteNotification = deleteNotification;
window.markAllRead = markAllRead;
window.clearAllNotifications = clearAllNotifications;
window.addNotification = addNotification;
window.sendTestNotification = sendTestNotification;
window.toggleNotifSection = toggleNotifSection;
