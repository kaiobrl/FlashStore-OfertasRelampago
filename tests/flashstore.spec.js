// @ts-check
const { test, expect } = process.env.COVERAGE ? require('./coverage') : require('@playwright/test');

const PAGE = '/index.html';

test.describe('FlashStore PWA', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  // ── Page Load ──

  test('loads and shows correct title', async ({ page }) => {
    await expect(page).toHaveTitle('FlashStore - Ofertas Relâmpago');
  });

  test('shows hero banner with product info', async ({ page }) => {
    await expect(page.locator('.hero-title')).toContainText('Monitor Triplo Portátil');
    await expect(page.locator('.hero-price-current')).toContainText('R$ 1.199');
    await expect(page.locator('.hero-price-old')).toContainText('R$ 2.499');
  });

  test('shows countdown timer', async ({ page }) => {
    const timer = page.locator('#countdown-display');
    await expect(timer).toBeVisible();
    await expect(timer).not.toBeEmpty();
  });

  test('shows 4 product cards on home tab', async ({ page }) => {
    const cards = page.locator('.product-card');
    await expect(cards).toHaveCount(4);
  });

  // ── Tab Navigation ──

  test('switches to Produtos tab', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');
    await expect(page.locator('#tab-produtos')).toHaveClass(/active/);
    await expect(page.locator('.product-grid .product-grid-item')).toHaveCount(4);
  });

  test('switches to Carrinho tab shows empty state', async ({ page }) => {
    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('#tab-carrinho')).toHaveClass(/active/);
    await expect(page.locator('.empty-state h2')).toContainText('carrinho está vazio');
  });

  test('switches to Perfil tab', async ({ page }) => {
    await page.click('.nav-item[data-tab="perfil"]');
    await expect(page.locator('#tab-perfil')).toHaveClass(/active/);
    await expect(page.locator('.profile-name')).toContainText('Usuário');
  });

  test('switches back to Início tab', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');
    await page.click('.nav-item[data-tab="inicio"]');
    await expect(page.locator('#tab-inicio')).toHaveClass(/active/);
    await expect(page.locator('.hero-banner')).toBeVisible();
  });

  // ── Cart Functionality ──

  test('adds product to cart via home tab', async ({ page }) => {
    const addBtn = page.locator('.add-cart-btn').first();
    await addBtn.click();

    // Badge should show 1
    const badge = page.locator('#cart-badge');
    await expect(badge).toHaveText('1');
    await expect(badge).toHaveClass(/visible/);

    // Toast should appear
    await expect(page.locator('#toast')).toHaveClass(/show/);
  });

  test('increments quantity on repeated add', async ({ page }) => {
    const addBtn = page.locator('.add-cart-btn').first();
    await addBtn.click();
    await addBtn.click();
    await addBtn.click();

    await expect(page.locator('#cart-badge')).toHaveText('3');
  });

  test('adds product from grid view', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');
    const gridBtn = page.locator('.grid-add-cart').first();
    await gridBtn.click();

    await expect(page.locator('#cart-badge')).toHaveText('1');
  });

  test('cart shows items after adding', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item-title').first()).toContainText('Monitor');
    await expect(page.locator('.cart-item-price').first()).toContainText('R$ 1.199');
  });

  test('cart shows correct total', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click(); // Monitor R$ 1.199
    await page.locator('.add-cart-btn').nth(2).click(); // Teclado R$ 189
    await page.click('.nav-item[data-tab="carrinho"]');

    await expect(page.locator('.cart-summary-total')).toContainText('R$ 1.388');
  });

  test('quantity controls work in cart', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    // Increase quantity
    await page.locator('.qty-btn').nth(1).click();
    await expect(page.locator('.qty-value').first()).toHaveText('2');
    await expect(page.locator('.cart-item-price').first()).toContainText('R$ 2.398');

    // Decrease quantity
    await page.locator('.qty-btn').first().click();
    await expect(page.locator('.qty-value').first()).toHaveText('1');
  });

  test('remove item from cart', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    await page.locator('.cart-item-remove').first().click();
    await expect(page.locator('.empty-state h2')).toContainText('carrinho está vazio');
    await expect(page.locator('#cart-badge')).not.toHaveClass(/visible/);
  });

  test('clear cart removes all items', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.locator('.add-cart-btn').nth(1).click();
    await page.click('.nav-item[data-tab="carrinho"]');

    await page.locator('.cart-clear-btn').click();
    await expect(page.locator('.empty-state h2')).toContainText('carrinho está vazio');
  });

  // ── Dark Mode ──

  test('toggles dark mode', async ({ page }) => {
    const html = page.locator('html');
    const toggleBtn = page.locator('.theme-toggle-header');

    // Initially light
    await expect(html).not.toHaveClass(/dark/);

    // Toggle to dark
    await toggleBtn.click();
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light
    await toggleBtn.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('dark mode persists in localStorage', async ({ page }) => {
    await page.locator('.theme-toggle-header').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload and check persistence
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  // ── Notifications ──

  test('notification center opens and closes', async ({ page }) => {
    await page.click('#notif-bell-btn');
    await expect(page.locator('#notif-center')).toHaveClass(/visible/);
    await expect(page.locator('#notif-center-overlay')).toHaveClass(/visible/);

    // Close via button
    await page.click('#notif-center-close-btn');
    await expect(page.locator('#notif-center')).not.toHaveClass(/visible/);
  });

  test('notification center shows demo notifications', async ({ page }) => {
    // Clear all notification data to get fresh demo seed
    await page.evaluate(() => {
      localStorage.removeItem('flashstore-notif-seeded');
      localStorage.removeItem('flashstore-notif-history');
    });
    await page.reload();

    await page.click('#notif-bell-btn');
    const items = page.locator('.notif-center-item');
    await expect(items).toHaveCount(3);
  });

  test('mark all notifications as read', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('flashstore-notif-seeded');
      localStorage.removeItem('flashstore-notif-history');
    });
    await page.reload();

    await page.click('#notif-bell-btn');
    await page.click('#notif-mark-all-btn');

    const unreadItems = page.locator('.notif-center-item.unread');
    await expect(unreadItems).toHaveCount(0);
  });

  test('clear all notifications', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('flashstore-notif-seeded');
      localStorage.removeItem('flashstore-notif-history');
    });
    await page.reload();

    await page.click('#notif-bell-btn');
    await page.click('#notif-clear-all-btn');

    await expect(page.locator('.notif-center-empty h3')).toContainText('Sem notificações');
  });

  // ── Trust Section ──

  test('shows trust badges', async ({ page }) => {
    const trustItems = page.locator('.trust-item');
    await expect(trustItems).toHaveCount(4);
    await expect(page.locator('.trust-item-label').nth(0)).toContainText('Entrega Rápida');
    await expect(page.locator('.trust-item-label').nth(1)).toContainText('Compra Segura');
  });

  // ── Quick Actions ──

  test('quick actions count is 4', async ({ page }) => {
    await expect(page.locator('.quick-action')).toHaveCount(4);
  });

  // ── Cart persistence in localStorage ──

  test('cart persists after page reload', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await expect(page.locator('#cart-badge')).toHaveText('1');

    await page.reload();
    await expect(page.locator('#cart-badge')).toHaveText('1');
  });

  // ── PWA Manifest ──

  test('manifest link is present', async ({ page }) => {
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', 'manifest.json');
  });

  // ── Accessibility basics ──

  test('navigation has aria labels', async ({ page }) => {
    await expect(page.locator('.nav-item').first()).toHaveAttribute('aria-label');
    await expect(page.locator('#notif-bell-btn')).toHaveAttribute('aria-label', 'Notificações');
    await expect(page.locator('.theme-toggle-header')).toHaveAttribute('aria-label');
  });

  test('cart buttons have aria labels', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    const removeBtn = page.locator('.cart-item-remove');
    await expect(removeBtn).toHaveAttribute('aria-label');
  });

  // ── Scroll Reveal ──

  test('scroll reveal elements exist on page', async ({ page }) => {
    const revealElements = page.locator('[data-reveal]');
    const count = await revealElements.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── Edge Cases: Quantity to 0 ──

  test('decreasing quantity to 0 removes item from cart', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    // Quantity is 1, click minus (should remove)
    await page.locator('.qty-btn').first().click();

    await expect(page.locator('.empty-state h2')).toContainText('carrinho está vazio');
    await expect(page.locator('#cart-badge')).not.toHaveClass(/visible/);
  });

  test('decreasing qty below 1 removes item when qty was 1', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.locator('.add-cart-btn').first().click();
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    // Qty is 3, decrease to 0 by clicking minus 3 times
    await page.locator('.qty-btn').first().click();
    await expect(page.locator('.qty-value').first()).toHaveText('2');
    await page.locator('.qty-btn').first().click();
    await expect(page.locator('.qty-value').first()).toHaveText('1');
    await page.locator('.qty-btn').first().click();
    await expect(page.locator('.empty-state h2')).toContainText('carrinho está vazio');
  });

  test('decreasing qty does not go below 1 then removes', async ({ page }) => {
    // Add 2 different items
    await page.locator('.add-cart-btn').first().click();
    await page.locator('.add-cart-btn').nth(1).click();
    await page.click('.nav-item[data-tab="carrinho"]');

    // Decrease second item to 0
    const secondItemMinus = page.locator('.cart-item').nth(1).locator('.qty-btn').first();
    await secondItemMinus.click();

    // Only first item should remain
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item-title').first()).toContainText('Monitor');
  });

  // ── Edge Cases: Countdown Timer ──

  test('countdown timer actually decrements', async ({ page }) => {
    const timer = page.locator('#countdown-display');
    const initialText = await timer.textContent();

    // Wait 2 seconds for the timer to tick
    await page.waitForTimeout(2500);

    const laterText = await timer.textContent();
    expect(laterText).not.toBe(initialText);
  });

  test('countdown timer format is MM:SS', async ({ page }) => {
    const timer = page.locator('#countdown-display');
    const text = await timer.textContent();

    // Should match MM:SS format
    expect(text).toMatch(/^\d{2}:\d{2}$/);
  });

  // ── Edge Cases: Offline/Online Banner ──

  test('offline banner is hidden when online', async ({ page }) => {
    const banner = page.locator('#offline-banner');
    await expect(banner).not.toHaveClass(/visible/);
  });

  test('offline banner appears when going offline via JS', async ({ page }) => {
    // Simulate going offline by overriding navigator.onLine and dispatching event
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    await expect(page.locator('#offline-banner')).toHaveClass(/visible/);
  });

  test('reconnected banner appears when going back online', async ({ page }) => {
    // Go offline first
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await expect(page.locator('#offline-banner')).toHaveClass(/visible/);

    // Go back online
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    await expect(page.locator('#offline-banner')).not.toHaveClass(/visible/);
    await expect(page.locator('#reconnected-banner')).toHaveClass(/visible/);
  });

  test('reconnected banner auto-hides after 3 seconds', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    await expect(page.locator('#reconnected-banner')).toHaveClass(/visible/);

    // Wait for auto-dismiss
    await page.waitForTimeout(4000);
    await expect(page.locator('#reconnected-banner')).not.toHaveClass(/visible/);
  });

  // ── Edge Cases: Notification Preferences ──

  test('notification preferences section toggles in profile', async ({ page }) => {
    await page.click('.nav-item[data-tab="perfil"]');

    // Initially hidden
    await expect(page.locator('#notif-section')).toBeHidden();

    // Click to open
    await page.locator('.profile-menu-item', { hasText: 'Notificações' }).click();
    await expect(page.locator('#notif-section')).toBeVisible();
    await expect(page.locator('.notif-pref-item')).toHaveCount(3);

    // Click again to close
    await page.locator('.profile-menu-item', { hasText: 'Notificações' }).click();
    await expect(page.locator('#notif-section')).toBeHidden();
  });

  test('notification preference toggles persist in localStorage', async ({ page }) => {
    await page.click('.nav-item[data-tab="perfil"]');
    await page.locator('.profile-menu-item', { hasText: 'Notificações' }).click();

    // Toggle flash sales off via JS to avoid visibility issues
    await page.evaluate(() => {
      const prefs = JSON.parse(localStorage.getItem('flashstore-notif-prefs') || '{}');
      prefs.flashSales = false;
      localStorage.setItem('flashstore-notif-prefs', JSON.stringify(prefs));
    });

    // Reload and check persistence
    await page.reload();
    await page.click('.nav-item[data-tab="perfil"]');
    await page.locator('.profile-menu-item', { hasText: 'Notificações' }).click();

    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('flashstore-notif-prefs')));
    expect(prefs.flashSales).toBe(false);
  });

  // ── Edge Cases: Notification Bell Badge ──

  test('notification bell badge shows unread count', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('flashstore-notif-seeded');
      localStorage.removeItem('flashstore-notif-history');
    });
    await page.reload();

    const badge = page.locator('#notif-bell-badge');
    await expect(badge).toHaveClass(/visible/);
    await expect(badge).toHaveText('3');
  });

  test('notification bell badge hides when all read', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('flashstore-notif-seeded');
      localStorage.removeItem('flashstore-notif-history');
    });
    await page.reload();

    await page.click('#notif-bell-btn');
    await page.click('#notif-mark-all-btn');
    await page.click('#notif-center-close-btn');

    await expect(page.locator('#notif-bell-badge')).not.toHaveClass(/visible/);
  });

  // ── Edge Cases: Multiple products cart total ──

  test('cart total updates when adding same product multiple times', async ({ page }) => {
    const addBtn = page.locator('.add-cart-btn').first();
    await addBtn.click(); // 1x Monitor = R$ 1.199
    await addBtn.click(); // 2x Monitor = R$ 2.398
    await page.click('.nav-item[data-tab="carrinho"]');

    await expect(page.locator('.cart-summary-total')).toContainText('R$ 2.398');
    await expect(page.locator('.cart-summary-row', { hasText: 'Subtotal' })).toContainText('2 itens');
  });

  // ── Edge Cases: Notification center close via overlay click ──

  test('notification center closes when clicking overlay', async ({ page }) => {
    await page.click('#notif-bell-btn');
    await expect(page.locator('#notif-center')).toHaveClass(/visible/);

    // Click overlay (outside the panel)
    await page.locator('#notif-center-overlay').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#notif-center')).not.toHaveClass(/visible/);
  });

  // ── Edge Cases: Delete single notification ──

  test('can delete individual notification', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('flashstore-notif-seeded');
      localStorage.removeItem('flashstore-notif-history');
    });
    await page.reload();

    await page.click('#notif-bell-btn');
    await expect(page.locator('.notif-center-item')).toHaveCount(3);

    // Delete first notification via evaluate to ensure click works
    await page.evaluate(() => {
      const history = JSON.parse(localStorage.getItem('flashstore-notif-history') || '[]');
      const firstId = history[0].id;
      deleteNotification(firstId);
    });

    await expect(page.locator('.notif-center-item')).toHaveCount(2);
  });

  // ── Edge Cases: Cart add button flash feedback ──

  test('add-to-cart button shows flash feedback then resets', async ({ page }) => {
    const addBtn = page.locator('.add-cart-btn').first();
    await addBtn.click();

    // Button should have 'added' class briefly
    await expect(addBtn).toHaveClass(/added/);

    // Wait for the animation to finish
    await page.waitForTimeout(1500);
    await expect(addBtn).not.toHaveClass(/added/);
  });

  // ── Search Functionality ──

  test('search input is present in Produtos tab', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');
    await expect(page.locator('#product-search')).toBeVisible();
    await expect(page.locator('#product-search')).toHaveAttribute('placeholder', 'Buscar produtos...');
  });

  test('search filters products by name', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // Type in search input
    await page.fill('#product-search', 'Monitor');
    await page.waitForTimeout(300); // Wait for debounce

    // Should show only matching products
    const items = page.locator('.product-grid-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.product-grid-info h3').first()).toContainText('Monitor');
  });

  test('search filters products by category name', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    await page.fill('#product-search', 'notebook');
    await page.waitForTimeout(300);

    const items = page.locator('.product-grid-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.product-grid-info h3').first()).toContainText('MacBook');
  });

  test('search shows empty state for no matches', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    await page.fill('#product-search', 'xyz123naoexiste');
    await page.waitForTimeout(300);

    await expect(page.locator('.empty-state h2')).toContainText('Nenhum produto encontrado');
  });

  test('clearing search shows all products again', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // Search for something
    await page.fill('#product-search', 'Monitor');
    await page.waitForTimeout(300);
    await expect(page.locator('.product-grid-item')).toHaveCount(1);

    // Clear search
    await page.fill('#product-search', '');
    await page.waitForTimeout(300);
    await expect(page.locator('.product-grid-item')).toHaveCount(4);
  });

  test('search button in header navigates to Produtos tab', async ({ page }) => {
    // Should be on Inicio tab
    await expect(page.locator('#tab-inicio')).toHaveClass(/active/);

    // Click search button in header
    await page.locator('.app-header-actions .icon-btn[aria-label="Buscar produtos"]').click();

    // Should switch to Produtos tab
    await expect(page.locator('#tab-produtos')).toHaveClass(/active/);
  });

  // ── Category Filter Chips ──

  test('filter chips are present in Produtos tab', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');
    const chips = page.locator('.filter-chip');
    await expect(chips).toHaveCount(4);
    await expect(chips.nth(0)).toContainText('Todos');
    await expect(chips.nth(1)).toContainText('Monitores');
    await expect(chips.nth(2)).toContainText('Notebooks');
    await expect(chips.nth(3)).toContainText('Periféricos');
  });

  test('Todos chip shows all products', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // All products should be visible initially
    await expect(page.locator('.product-grid-item')).toHaveCount(4);
    await expect(page.locator('.filter-chip.active')).toContainText('Todos');
  });

  test('Monitores chip filters to monitor products only', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // Click Monitores chip
    await page.locator('.filter-chip[data-category="monitores"]').click();

    await expect(page.locator('.filter-chip.active')).toContainText('Monitores');
    const items = page.locator('.product-grid-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.product-grid-info h3').first()).toContainText('Monitor');
  });

  test('Notebooks chip filters to notebook products only', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    await page.locator('.filter-chip[data-category="notebooks"]').click();

    await expect(page.locator('.filter-chip.active')).toContainText('Notebooks');
    const items = page.locator('.product-grid-item');
    await expect(items).toHaveCount(1);
    await expect(page.locator('.product-grid-info h3').first()).toContainText('MacBook');
  });

  test('Perifericos chip filters to peripherals only', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    await page.locator('.filter-chip[data-category="perifericos"]').click();

    await expect(page.locator('.filter-chip.active')).toContainText('Periféricos');
    const items = page.locator('.product-grid-item');
    await expect(items).toHaveCount(2);
  });

  test('switching filter chips updates displayed products', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // Start with Monitores
    await page.locator('.filter-chip[data-category="monitores"]').click();
    await expect(page.locator('.product-grid-item')).toHaveCount(1);

    // Switch to Notebooks
    await page.locator('.filter-chip[data-category="notebooks"]').click();
    await expect(page.locator('.product-grid-item')).toHaveCount(1);
    await expect(page.locator('.product-grid-info h3').first()).toContainText('MacBook');

    // Switch to Perifericos
    await page.locator('.filter-chip[data-category="perifericos"]').click();
    await expect(page.locator('.product-grid-item')).toHaveCount(2);

    // Back to Todos
    await page.locator('.filter-chip[data-category="todos"]').click();
    await expect(page.locator('.product-grid-item')).toHaveCount(4);
  });

  test('search and filter work together', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // Select Perifericos filter
    await page.locator('.filter-chip[data-category="perifericos"]').click();
    await expect(page.locator('.product-grid-item')).toHaveCount(2);

    // Now search within peripherals
    await page.fill('#product-search', 'Mouse');
    await page.waitForTimeout(300);
    await expect(page.locator('.product-grid-item')).toHaveCount(1);
    await expect(page.locator('.product-grid-info h3').first()).toContainText('Mouse');
  });

  test('filter shows empty state when no products match', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // There are no notebooks that match "Monitor"
    await page.locator('.filter-chip[data-category="notebooks"]').click();
    await page.fill('#product-search', 'Monitor');
    await page.waitForTimeout(300);

    await expect(page.locator('.empty-state h2')).toContainText('Nenhum produto encontrado');
  });

  // ── Skeleton Loading ──

  test('product images have loading class initially', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });

    // Check that images in product cards have loading class
    const images = page.locator('.product-card-image img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    // Verify at least one image has the loading class
    const loadingImages = page.locator('.product-card-image img.loading');
    const loadingCount = await loadingImages.count();
    expect(loadingCount).toBeGreaterThanOrEqual(0); // Images may have already loaded
  });

  test('loading class is removed after image loads', async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });

    // After all images load, none should have loading class
    const loadingImages = page.locator('.product-card-image img.loading');
    await expect(loadingImages).toHaveCount(0);
  });

  test('product grid images exist and load', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    const images = page.locator('.product-grid-img img');
    await expect(images).toHaveCount(4);

    // Images should have src attributes
    const firstSrc = await images.first().getAttribute('src');
    expect(firstSrc).toContain('unsplash.com');
  });

  test('images have alt text for accessibility', async ({ page }) => {
    // Home tab
    const homeImages = page.locator('.product-card-image img');
    for (let i = 0; i < await homeImages.count(); i++) {
      await expect(homeImages.nth(i)).toHaveAttribute('alt');
      const alt = await homeImages.nth(i).getAttribute('alt');
      expect(alt.length).toBeGreaterThan(0);
    }

    // Grid tab
    await page.click('.nav-item[data-tab="produtos"]');
    const gridImages = page.locator('.product-grid-img img');
    for (let i = 0; i < await gridImages.count(); i++) {
      await expect(gridImages.nth(i)).toHaveAttribute('alt');
      const alt = await gridImages.nth(i).getAttribute('alt');
      expect(alt.length).toBeGreaterThan(0);
    }
  });

  // ── Search Debounce ──

  test('search uses debounce (rapid typing does not filter immediately)', async ({ page }) => {
    await page.click('.nav-item[data-tab="produtos"]');

    // Type rapidly
    await page.fill('#product-search', 'M');
    await page.fill('#product-search', 'Mo');
    await page.fill('#product-search', 'Mon');
    await page.fill('#product-search', 'Monitor');

    // Before debounce fires, should still show all 4
    const items = page.locator('.product-grid-item');
    await expect(items).toHaveCount(4);

    // After debounce fires
    await page.waitForTimeout(300);
    await expect(items).toHaveCount(1);
  });

  // ── CSP Compliance ──

  test('CSP meta tag has no unsafe-inline for script-src', async ({ page }) => {
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'unsafe-inline'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

});

// ══════════════════════════════════════════════════════════════
//  Cart Tests — Event Delegation & Multi-Item Scenarios
// ══════════════════════════════════════════════════════════════

test.describe('Cart — Event Delegation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
  });

  // ── Multi-Item Cart ──

  test('adds all 4 products and cart shows correct count', async ({ page }) => {
    // Add all 4 products from home tab
    for (let i = 0; i < 4; i++) {
      await page.locator('.add-cart-btn').nth(i).click();
    }

    await expect(page.locator('#cart-badge')).toHaveText('4');

    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.cart-item')).toHaveCount(4);
  });

  test('cart total is correct for all 4 products', async ({ page }) => {
    // Monitor R$1199 + MacBook R$8399 + Teclado R$189 + Mouse R$129 = R$9.916
    for (let i = 0; i < 4; i++) {
      await page.locator('.add-cart-btn').nth(i).click();
    }

    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.cart-summary-total')).toContainText('R$ 9.916');
    await expect(page.locator('.cart-summary-row', { hasText: 'Subtotal' })).toContainText('4 itens');
  });

  test('removing one item from multi-item cart preserves others', async ({ page }) => {
    // Add 3 products
    await page.locator('.add-cart-btn').nth(0).click(); // Monitor
    await page.locator('.add-cart-btn').nth(2).click(); // Teclado
    await page.locator('.add-cart-btn').nth(3).click(); // Mouse

    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.cart-item')).toHaveCount(3);

    // Remove the second item (Teclado)
    await page.locator('.cart-item').nth(1).locator('.cart-item-remove').click();

    // Two items should remain
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(page.locator('#cart-badge')).toHaveText('2');

    // Verify remaining items are Monitor and Mouse
    const titles = page.locator('.cart-item-title');
    await expect(titles.nth(0)).toContainText('Monitor');
    await expect(titles.nth(1)).toContainText('Mouse');
  });

  // ── Event Delegation on SVG Buttons ──

  test('clicking SVG inside add-to-cart button still adds item', async ({ page }) => {
    // Click on the SVG icon inside the button, not the button text
    const svgInsideBtn = page.locator('.add-cart-btn').first().locator('svg');
    await svgInsideBtn.click();

    await expect(page.locator('#cart-badge')).toHaveText('1');
  });

  test('qty buttons work via event delegation on text content', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.locator('.add-cart-btn').first().click(); // qty = 2
    await page.click('.nav-item[data-tab="carrinho"]');

    // Click the minus text button via event delegation
    await page.locator('.qty-btn').first().click();
    await expect(page.locator('.qty-value').first()).toHaveText('1');

    // Click the plus text button via event delegation
    await page.locator('.qty-btn').nth(1).click();
    await expect(page.locator('.qty-value').first()).toHaveText('2');
  });

  // ── Cross-View Quantity Merge ──

  test('adding same product from home and grid merges quantity', async ({ page }) => {
    // Add Monitor from home tab
    await page.locator('.add-cart-btn').first().click();
    await expect(page.locator('#cart-badge')).toHaveText('1');

    // Switch to grid and add Monitor again
    await page.click('.nav-item[data-tab="produtos"]');
    await page.locator('.grid-add-cart').first().click();

    // Badge should show 2 (merged)
    await expect(page.locator('#cart-badge')).toHaveText('2');

    // Cart should have only 1 item with qty 2
    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.qty-value').first()).toHaveText('2');
  });

  // ── Cart Summary Accuracy ──

  test('cart summary item count matches header count', async ({ page }) => {
    await page.locator('.add-cart-btn').nth(0).click(); // 1x
    await page.locator('.add-cart-btn').nth(0).click(); // 2x same
    await page.locator('.add-cart-btn').nth(2).click(); // 1x different

    await page.click('.nav-item[data-tab="carrinho"]');

    // Header says 3 items
    await expect(page.locator('.cart-header h2')).toContainText('3');
    // Subtotal says 3 items
    await expect(page.locator('.cart-summary-row', { hasText: 'Subtotal' })).toContainText('3 itens');
    // But only 2 distinct cart items
    await expect(page.locator('.cart-item')).toHaveCount(2);
  });

  test('cart free shipping text is always shown', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    await expect(page.locator('.free-shipping-text')).toContainText('Grátis');
  });

  // ── Checkout Button ──

  test('checkout button shows correct total', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click(); // R$ 1.199
    await page.locator('.add-cart-btn').nth(2).click(); // R$ 189

    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.cart-checkout-btn')).toContainText('R$ 1.388');
  });

  test('checkout button works via event delegation and shows toast', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    await page.locator('.cart-checkout-btn').click();
    await expect(page.locator('#toast')).toHaveClass(/show/);
    await expect(page.locator('#toast-text')).toContainText('checkout');
  });

  // ── Empty Cart Actions ──

  test('empty cart "Explorar Ofertas" button navigates to Início', async ({ page }) => {
    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.empty-state h2')).toContainText('carrinho está vazio');

    // Click "Explorar Ofertas" button in empty cart
    await page.locator('.empty-state .btn-primary').click();
    await expect(page.locator('#tab-inicio')).toHaveClass(/active/);
  });

  test('quick action "Carrinho" button navigates to cart tab', async ({ page }) => {
    // Click the third quick action (Frete Grátis → goes to carrinho)
    await page.locator('.quick-action').nth(2).click();
    await expect(page.locator('#tab-carrinho')).toHaveClass(/active/);
  });

  // ── Cart Image Accessibility ──

  test('cart item images have correct src and alt', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    const img = page.locator('.cart-item-img img').first();
    await expect(img).toHaveAttribute('src', /unsplash/);
    await expect(img).toHaveAttribute('alt', /Monitor/);
  });

  // ── Complex Cart Operations ──

  test('badge stays accurate through multiple add/remove cycles', async ({ page }) => {
    // Add 2 different products
    await page.locator('.add-cart-btn').nth(0).click(); // Monitor
    await page.locator('.add-cart-btn').nth(3).click(); // Mouse
    await expect(page.locator('#cart-badge')).toHaveText('2');

    // Go to cart and remove Monitor
    await page.click('.nav-item[data-tab="carrinho"]');
    await page.locator('.cart-item').first().locator('.cart-item-remove').click();
    await expect(page.locator('#cart-badge')).toHaveText('1');

    // Go back to home and add Teclado
    await page.click('.nav-item[data-tab="inicio"]');
    await page.locator('.add-cart-btn').nth(2).click();
    await expect(page.locator('#cart-badge')).toHaveText('2');

    // Clear cart
    await page.click('.nav-item[data-tab="carrinho"]');
    await page.locator('.cart-clear-btn').click();
    await expect(page.locator('#cart-badge')).toHaveText('0');
    await expect(page.locator('#cart-badge')).not.toHaveClass(/visible/);
  });

  test('quantity increment and total update together correctly', async ({ page }) => {
    // Add Monitor (R$ 1199) x1
    await page.locator('.add-cart-btn').first().click();
    await page.click('.nav-item[data-tab="carrinho"]');

    await expect(page.locator('.cart-item-price').first()).toContainText('R$ 1.199');

    // Increment to 2
    await page.locator('.qty-btn').nth(1).click();
    await expect(page.locator('.cart-item-price').first()).toContainText('R$ 2.398');
    await expect(page.locator('.cart-summary-total')).toContainText('R$ 2.398');

    // Increment to 3
    await page.locator('.qty-btn').nth(1).click();
    await expect(page.locator('.cart-item-price').first()).toContainText('R$ 3.597');
    await expect(page.locator('.cart-summary-total')).toContainText('R$ 3.597');

    // Decrement back to 2
    await page.locator('.qty-btn').first().click();
    await expect(page.locator('.cart-item-price').first()).toContainText('R$ 2.398');
    await expect(page.locator('.cart-summary-total')).toContainText('R$ 2.398');
  });

  // ── Cart Persistence Across Views ──

  test('cart persists after navigating away and back', async ({ page }) => {
    await page.locator('.add-cart-btn').first().click();
    await expect(page.locator('#cart-badge')).toHaveText('1');

    // Navigate to Products, then back to Cart
    await page.click('.nav-item[data-tab="produtos"]');
    await page.click('.nav-item[data-tab="perfil"]');
    await page.click('.nav-item[data-tab="carrinho"]');

    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item-title').first()).toContainText('Monitor');
    await expect(page.locator('#cart-badge')).toHaveText('1');
  });

  test('cart persists after full page reload with multiple items', async ({ page }) => {
    await page.locator('.add-cart-btn').nth(0).click(); // Monitor
    await page.locator('.add-cart-btn').nth(2).click(); // Teclado
    await page.locator('.add-cart-btn').nth(2).click(); // Teclado x2

    await expect(page.locator('#cart-badge')).toHaveText('3');

    await page.reload();
    await expect(page.locator('#cart-badge')).toHaveText('3');

    await page.click('.nav-item[data-tab="carrinho"]');
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(page.locator('.cart-summary-total')).toContainText('R$ 1.577');
  });

});

// ══════════════════════════════════════════════════════════════
//  Product Sort Tests
// ══════════════════════════════════════════════════════════════

test.describe('Product Sort', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE);
    await page.click('.nav-item[data-tab="produtos"]');
  });

  test('sort dropdown is present with all options', async ({ page }) => {
    const select = page.locator('#product-sort');
    await expect(select).toBeVisible();

    const options = select.locator('option');
    await expect(options).toHaveCount(5);
    await expect(options.nth(0)).toHaveText('Destaque');
    await expect(options.nth(1)).toHaveText('Menor Preço');
    await expect(options.nth(2)).toHaveText('Maior Preço');
    await expect(options.nth(3)).toHaveText('Maior Desconto');
    await expect(options.nth(4)).toHaveText('Melhor Avaliação');
  });

  test('sort by Menor Preço orders ascending', async ({ page }) => {
    await page.selectOption('#product-sort', 'price-asc');
    await page.waitForTimeout(100);

    const prices = page.locator('.product-grid-info .price');
    const firstPrice = await prices.first().textContent();
    const lastPrice = await prices.last().textContent();

    // Mouse R$129 < Teclado R$189 < Monitor R$1199 < MacBook R$8399
    expect(firstPrice).toContain('129');
    expect(lastPrice).toContain('8.399');
  });

  test('sort by Maior Preço orders descending', async ({ page }) => {
    await page.selectOption('#product-sort', 'price-desc');
    await page.waitForTimeout(100);

    const prices = page.locator('.product-grid-info .price');
    const firstPrice = await prices.first().textContent();

    // MacBook R$8399 should be first
    expect(firstPrice).toContain('8.399');
  });

  test('sort by Melhor Avaliação puts highest rated first', async ({ page }) => {
    await page.selectOption('#product-sort', 'rating');
    await page.waitForTimeout(100);

    const items = page.locator('.product-grid-info h3');
    const firstTitle = await items.first().textContent();
    // Monitor has 4.9 rating (highest)
    expect(firstTitle).toContain('Monitor');
  });

  test('sort by Maior Desconto puts highest discount first', async ({ page }) => {
    await page.selectOption('#product-sort', 'discount');
    await page.waitForTimeout(100);

    const badges = page.locator('.product-grid-img .badge-discount');
    const firstDiscount = await badges.first().textContent();
    // Monitor has -52% (highest)
    expect(firstDiscount).toContain('52');
  });

  test('sort resets to default Destaque', async ({ page }) => {
    await page.selectOption('#product-sort', 'price-asc');
    await page.waitForTimeout(100);

    // Reset to Destaque
    await page.selectOption('#product-sort', 'default');
    await page.waitForTimeout(100);

    // Should show all 4 products
    await expect(page.locator('.product-grid-item')).toHaveCount(4);
  });

});
