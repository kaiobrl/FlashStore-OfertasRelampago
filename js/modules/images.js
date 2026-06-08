export function handleImageLoad(img) {
    img.addEventListener('load', () => {
        img.classList.remove('loading');
    });
    img.addEventListener('error', () => {
        img.classList.remove('loading');
        img.alt = 'Erro ao carregar imagem';
    });
}

export function initImageObserver() {
    const imageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') handleImageLoad(node);
                    node.querySelectorAll('img').forEach(handleImageLoad);
                }
            });
        });
    });

    imageObserver.observe(document.body, { childList: true, subtree: true });
}
