import { NOTIF_HISTORY_KEY, NOTIF_SEEDED_KEY, NOTIF_PREFS_KEY, NOTIF_DISMISSED_KEY } from './constants.js';

let notifications = JSON.parse(localStorage.getItem(NOTIF_HISTORY_KEY) || '[]');

export function getNotifications() {
    return notifications;
}

export function saveNotifications() {
    localStorage.setItem(NOTIF_HISTORY_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { notifications } }));
}

export function addNotification(title, body, type) {
    const notif = {
        id: Date.now(),
        title,
        body,
        type: type || 'info',
        read: false,
        timestamp: new Date().toISOString()
    };
    notifications.unshift(notif);
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    saveNotifications();
    return notif;
}

export function markNotifRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications();
    }
}

export function markAllRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
}

export function clearAllNotifications() {
    notifications = [];
    saveNotifications();
}

export function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    saveNotifications();
}

export function getUnreadCount() {
    return notifications.filter(n => !n.read).length;
}

export function seedDemoNotifications() {
    if (!localStorage.getItem(NOTIF_SEEDED_KEY)) {
        addNotification('⚡ Oferta Relâmpago!', 'Monitor Triplo Portátil 14" com 52% OFF — R$ 1.199', 'flash');
        addNotification('📦 Pedido Enviado!', 'Seu pedido #2847 foi enviado via expresso', 'order');
        addNotification('🎉 Cupom de Boas-vindas', 'Use o cupom BEMVINDO10 e ganhe 10% OFF na primeira compra', 'promo');
        localStorage.setItem(NOTIF_SEEDED_KEY, 'true');
    }
}

export function getNotifPrefs() {
    const defaults = { flashSales: true, orderUpdates: true, promotions: true };
    try {
        const saved = JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY));
        return saved || defaults;
    } catch { return defaults; }
}

export function saveNotifPrefs(prefs) {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

export function isNotifBannerDismissed() {
    return localStorage.getItem(NOTIF_DISMISSED_KEY) === 'true';
}

export function dismissNotifBanner() {
    localStorage.setItem(NOTIF_DISMISSED_KEY, 'true');
}
