import { showToast } from './renderers.js';
import { isNotifBannerDismissed, dismissNotifBanner } from './notifications.js';

const VAPID_PUBLIC_KEY = null; // TODO: Set this in production

export function initPushNotifications() {
    setTimeout(showNotifBanner, 3000);

    const allowBtn = document.getElementById('notif-allow-btn');
    if (allowBtn) {
        allowBtn.addEventListener('click', requestNotificationPermission);
    }

    const dismissBtn = document.getElementById('notif-dismiss-btn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            const banner = document.getElementById('notif-banner');
            if (banner) banner.classList.remove('visible');
            dismissNotifBanner();
        });
    }
}

function showNotifBanner() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    if (isNotifBannerDismissed()) return;
    const banner = document.getElementById('notif-banner');
    if (banner) banner.classList.add('visible');
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Notificações não suportadas neste navegador');
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        showToast('Notificações ativadas! 🔔');
        if (VAPID_PUBLIC_KEY) {
            registerPushSubscription();
        }
    } else {
        showToast('Notificações bloqueadas');
    }
    const banner = document.getElementById('notif-banner');
    if (banner) banner.classList.remove('visible');
}

async function registerPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC_KEY
        });
        console.log('Push subscription:', subscription);
    } catch (err) {
        console.log('Push subscription failed:', err);
    }
}
