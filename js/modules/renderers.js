import { PRODUCTS } from './constants.js';
import { escapeHtml, formatBRL, formatNotifTime } from './utils.js';
import { getCart, getCartTotal, getCartCount } from './cart.js';
import { getNotifications, getUnreadCount, getNotifPrefs } from './notifications.js';

// ── Badge ──
export function updateBadge() {
    const badge = document.getElementById('cart-badge');
    const count = getCartCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
}

// ── Toast ──
let toastTimeout;
export function showToast(text) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (!toast || !toastText) return;
    
    toastText.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Render Product List (Home) ──
export function renderProductList(products) {
    const list = products || PRODUCTS;
    const container = document.getElementById('product-list-home');
    if (!container) return;
    
    const delays = ['delay-0', 'delay-1', 'delay-2', 'delay-3'];
    container.innerHTML = list.map((p, i) => `
        <div class="product-card ${delays[i % 4]}" data-reveal>
            <div class="product-card-image">
                <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy" width="100" height="100" class="loading"/>
            </div>
            <div class="product-card-info">
                <span class="product-card-badge">${escapeHtml(p.discount)}</span>
                <h3 class="product-card-title">${escapeHtml(p.name)}</h3>
                <div class="product-card-rating">
                    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ${escapeHtml(String(p.rating))} · ${escapeHtml(p.sold)} vendidos
                </div>
                <div class="product-card-price">
                    <span class="product-card-price-current">${formatBRL(p.price)}</span>
                    <span class="product-card-price-old">${formatBRL(p.oldPrice)}</span>
                </div>
                <button class="add-cart-btn" data-action="add-to-cart" data-id="${p.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar
                </button>
            </div>
        </div>
    `).join('');
}

// ── Render Product Grid ──
export function renderProductGrid(products) {
    const list = products || PRODUCTS;
    const container = document.getElementById('product-grid');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h2>Nenhum produto encontrado</h2><p>Tente buscar por outro termo ou categoria</p></div>';
        return;
    }
    
    const gridDelays = ['delay-0', 'delay-1', 'delay-2', 'delay-3'];
    container.innerHTML = list.map((p, i) => `
        <div class="product-grid-item ${gridDelays[i % 4]}" data-reveal>
            <div class="product-grid-img">
                <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy" width="200" height="200" class="loading"/>
                <span class="badge-discount">${escapeHtml(p.discount)}</span>
            </div>
            <div class="product-grid-info">
                <h3>${escapeHtml(p.name)}</h3>
                <span class="price">${formatBRL(p.price)}</span>
                <button class="grid-add-cart" data-action="add-to-cart" data-id="${p.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar
                </button>
            </div>
        </div>
    `).join('');
}

// ── Render Cart ──
export function renderCart(force) {
    const tab = document.getElementById('tab-carrinho');
    if (!force && (!tab || !tab.classList.contains('active'))) return;
    
    const container = document.getElementById('cart-content');
    if (!container) return;

    const cart = getCart();
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                <h2>Seu carrinho está vazio</h2>
                <p>Adicione produtos incríveis ao seu carrinho</p>
                <button class="btn-primary" data-action="switch-tab" data-tab="inicio">Explorar Ofertas</button>
            </div>
        `;
        return;
    }

    const itemsHtml = cart.map(item => {
        const p = PRODUCTS.find(pr => pr.id === item.id);
        if (!p) return '';
        return `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy" width="80" height="80" class="loading"/>
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-title">${escapeHtml(p.name)}</span>
                    <span class="cart-item-price">${formatBRL(p.price * item.qty)}</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" data-action="update-qty" data-id="${p.id}" data-delta="-1" aria-label="Diminuir quantidade">−</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn" data-action="update-qty" data-id="${p.id}" data-delta="1" aria-label="Aumentar quantidade">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-action="remove-from-cart" data-id="${p.id}" aria-label="Remover ${escapeHtml(p.name)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
            </div>
        `;
    }).join('');

    const total = getCartTotal();
    const count = getCartCount();

    container.innerHTML = `
        <div class="cart-header">
            <h2>Meu Carrinho (${count})</h2>
            <button class="cart-clear-btn" data-action="clear-cart">Limpar tudo</button>
        </div>
        <div class="cart-items">${itemsHtml}</div>
        <div class="cart-summary">
            <div class="cart-summary-row">
                <span>Subtotal (${count} itens)</span>
                <span>${formatBRL(total)}</span>
            </div>
            <div class="cart-summary-row">
                <span>Frete</span>
                <span class="free-shipping-text">Grátis</span>
            </div>
            <div class="cart-summary-total">
                <span>Total</span>
                <span>${formatBRL(total)}</span>
            </div>
        </div>
        <button class="cart-checkout-btn" data-action="checkout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Finalizar Compra · ${formatBRL(total)}
        </button>
    `;
}

// ── Notification Center ──
export function updateNotifBellBadge() {
    const badge = document.getElementById('notif-bell-badge');
    if (!badge) return;
    const count = getUnreadCount();
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.toggle('visible', count > 0);
}

function getNotifIcon(type) {
    const icons = {
        flash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        order: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 00-2-2H4a2 2 0 00-2 2v11a1 1 0 001 1h2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
        promo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return icons[type] || icons.info;
}

export function renderNotificationCenter() {
    const container = document.getElementById('notif-center-list');
    if (!container) return;
    
    const notifications = getNotifications();
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notif-center-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                <h3>Sem notificações</h3>
                <p>Quando houver novidades, elas aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(n => `
        <div class="notif-center-item ${n.read ? '' : 'unread'}" data-action="mark-notif-read" data-id="${n.id}">
            <div class="notif-item-icon gradient-${n.type}">
                ${getNotifIcon(n.type)}
            </div>
            <div class="notif-item-content">
                <div class="notif-item-title">${escapeHtml(n.title)}</div>
                <div class="notif-item-body">${escapeHtml(n.body)}</div>
                <div class="notif-item-time">${formatNotifTime(n.timestamp)}</div>
            </div>
            <button class="notif-item-delete" data-action="delete-notification" data-id="${n.id}" aria-label="Remover notificação">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    `).join('');
}

export function renderNotifPrefs() {
    const prefs = getNotifPrefs();
    const container = document.getElementById('notif-prefs-list');
    if (!container) return;

    container.innerHTML = `
        <div class="notif-pref-item">
            <div class="notif-pref-info">
                <div class="notif-pref-info-icon gradient-flash">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div class="notif-pref-info-text">
                    <h3>Ofertas Relâmpago</h3>
                    <p>Alertas de preços baixos</p>
                </div>
            </div>
            <label class="switch">
                <input type="checkbox" data-pref="flashSales" ${prefs.flashSales ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="notif-pref-item">
            <div class="notif-pref-info">
                <div class="notif-pref-info-icon gradient-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 00-2-2H4a2 2 0 00-2 2v11a1 1 0 001 1h2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                </div>
                <div class="notif-pref-info-text">
                    <h3>Atualizações do Pedido</h3>
                    <p>Status de entrega e envio</p>
                </div>
            </div>
            <label class="switch">
                <input type="checkbox" data-pref="orderUpdates" ${prefs.orderUpdates ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="notif-pref-item">
            <div class="notif-pref-info">
                <div class="notif-pref-info-icon gradient-purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </div>
                <div class="notif-pref-info-text">
                    <h3>Promoções</h3>
                    <p>Novidades e cupons</p>
                </div>
            </div>
            <label class="switch">
                <input type="checkbox" data-pref="promotions" ${prefs.promotions ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    `;
}
