import { INSTALL_DISMISSED_KEY } from './constants.js';
import { showToast } from './renderers.js';
import { addNotification } from './notifications.js';

let deferredPrompt;

export function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then((reg) => {
                    console.log('SW registered:', reg.scope);
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                                showToast('Nova versão disponível! Recarregue a página.');
                            }
                        });
                    });
                })
                .catch((err) => console.log('SW registration failed:', err));
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Não prevenimos o padrão para garantir que o banner seja exibido pelo navegador
        // conforme sugerido para resolver o erro "Banner não exibido"
        // e.preventDefault(); 
        deferredPrompt = e;
        setTimeout(showInstallBanner, 5000);
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallBanner();
        addNotification('✅ FlashStore instalado!', 'Agora acesse rapidamente pela tela inicial', 'info');
        showToast('FlashStore instalado com sucesso! 🎉');
    });

    const acceptBtn = document.getElementById('install-accept-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install outcome:', outcome);
            deferredPrompt = null;
            hideInstallBanner();
        });
    }

    const dismissBtn = document.getElementById('install-dismiss-btn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            hideInstallBanner();
            localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
        });
    }
}

function showInstallBanner() {
    if (!deferredPrompt) return;
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('visible');
}

function hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('visible');
}
