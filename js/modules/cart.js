import { PRODUCTS, CART_KEY } from './constants.js';

let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

export function getCart() {
    return cart;
}

export function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // We'll use custom events to notify other modules about state changes
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { cart } }));
}

export function addToCart(productId) {
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    saveCart();
    return PRODUCTS.find(p => p.id === productId);
}

export function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
}

export function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
        return;
    }
    saveCart();
}

export function clearCart() {
    cart = [];
    saveCart();
}

export function getCartTotal() {
    return cart.reduce((sum, item) => {
        const product = PRODUCTS.find(p => p.id === item.id);
        return sum + (product ? product.price * item.qty : 0);
    }, 0);
}

export function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}
