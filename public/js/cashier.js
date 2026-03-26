/**
 * Cashier Page Logic
 * Handles product loading, cart management, and checkout
 */

let isLoading = false;

function getProductInventoryMeta(product) {
  const inventoryType = product.inventoryType === 'weight' ? 'weight' : 'unit';
  const baseUnit = product.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
  const salesUnit = product.salesUnit === 'kg' || product.salesUnit === 'g'
    ? product.salesUnit
    : (inventoryType === 'weight' ? 'kg' : 'pcs');
  const quantityOnHand = Number(product.quantityOnHand ?? product.stock ?? 0);
  const saleStep = Number(product.saleStep ?? (inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1));

  return { inventoryType, baseUnit, salesUnit, quantityOnHand, saleStep };
}

function convertSalesToBase(quantity, soldUnit, baseUnit) {
  const numeric = Number(quantity || 0);
  if (baseUnit === 'g' && soldUnit === 'kg') {
    return numeric * 1000;
  }
  return numeric;
}

function convertBaseToSales(quantity, baseUnit, salesUnit) {
  const numeric = Number(quantity || 0);
  if (baseUnit === 'g' && salesUnit === 'kg') {
    return numeric / 1000;
  }
  return numeric;
}

function formatQuantity(value, unit) {
  const numeric = Number(value || 0);
  if (unit === 'kg') {
    return `${numeric.toFixed(2).replace(/\.00$/, '')} ${unit}`;
  }
  if (unit === 'pcs') {
    return `${Math.round(numeric)} ${unit}`;
  }
  return `${numeric.toFixed(0)} ${unit}`;
}

function getCartItemBaseQuantity(cartItem, product) {
  const productMeta = getProductInventoryMeta(product || cartItem || {});
  const soldUnit = cartItem.soldUnit || productMeta.salesUnit;
  return convertSalesToBase(cartItem.quantity, soldUnit, productMeta.baseUnit);
}

function toStep(value, step, mode) {
  const numeric = Number(value || 0);
  if (mode === 'unit') {
    return Math.max(0, Math.round(numeric));
  }

  const precision = step.toString().includes('.') ? step.toString().split('.')[1].length : 0;
  const rounded = Math.round(numeric / step) * step;
  return Number(rounded.toFixed(precision));
}

/**
 * Filter products locally by search query
 */
function filterProducts(query = '') {
  const normalizedQuery = (query || '').trim().toLowerCase();
  const allProducts = Products.getAll() || [];

  if (!normalizedQuery) {
    return allProducts;
  }

  return allProducts.filter(product =>
    (product.name || '').toLowerCase().includes(normalizedQuery) ||
    (product.description || '').toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Initialize page
 */
async function initPage() {
  // Check authentication
  Auth.requireCashier();

  // Set user info
  const user = Auth.getCurrentUser();
  document.getElementById('userName').textContent = user.name || 'User';
  document.getElementById('userRole').textContent = user.role || 'Cashier';

  // Load products
  await loadProducts();

  // Set up event listeners
  setupEventListeners();

  // Update cart display
  updateCartDisplay();
}

/**
 * Load products from API
 */
async function loadProducts() {
  try {
    isLoading = true;
    document.getElementById('productsGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const token = API.getToken();
    console.log('Token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');

    await Products.fetchAll();
    displayProducts(Products.getAll());
  } catch (error) {
    console.error('Error loading products:', error);
    console.log('Current token:', API.getToken());
    document.getElementById('productsGrid').innerHTML = `
      <div class="empty-products">
        <div class="empty-products-icon">❌</div>
        <p>Error loading products</p>
        <p style="font-size: 12px; color: var(--gray-400);">${error.message}</p>
        <p style="font-size: 11px; color: var(--gray-300); margin-top: 10px;">Check browser console for details</p>
      </div>
    `;
  } finally {
    isLoading = false;
  }
}

/**
 * Display products in grid
 */
function displayProducts(products) {
  const grid = document.getElementById('productsGrid');

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="empty-products">
        <div class="empty-products-icon">📦</div>
        <p>No products found</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const inventory = getProductInventoryMeta(product);
    const availableForSale = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, inventory.salesUnit);
    const isOutOfStock = inventory.quantityOnHand <= 0;
    return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-image">
        ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '📦'}
      </div>
      <div class="product-info">
        <div class="product-name" title="${product.name}">${product.name}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-stock">Stock: ${formatQuantity(availableForSale, inventory.salesUnit)}</div>
      </div>
      <button class="product-btn" type="button" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  `;
  }).join('');

  // Attach click handlers
  grid.querySelectorAll('.product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.id;
      const product = Products.getById(productId);
      if (product) {
        const inventory = getProductInventoryMeta(product);
        const cartItem = Cart.getItems().find(item => item.id === productId);
        const currentQtyInCartBase = cartItem ? getCartItemBaseQuantity(cartItem, product) : 0;
        const requestedBaseQuantity = currentQtyInCartBase + convertSalesToBase(inventory.saleStep, inventory.salesUnit, inventory.baseUnit);

        if (inventory.quantityOnHand <= 0) {
          showNotification(`${product.name} is out of stock`, 'error');
          return;
        }

        if (requestedBaseQuantity > inventory.quantityOnHand) {
          const availableSales = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, inventory.salesUnit);
          showNotification(`Cannot add more than available stock (${formatQuantity(availableSales, inventory.salesUnit)})`, 'error');
          return;
        }

        Cart.addItem({
          ...product,
          soldUnit: inventory.salesUnit,
          saleStep: inventory.saleStep,
          inventoryType: inventory.inventoryType,
        }, inventory.saleStep);
        updateCartDisplay();
        showNotification(`${product.name} added to cart`, 'success');
      }
    });
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value;
    displayProducts(filterProducts(query));
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      Auth.logout();
    }
  });

  // Checkout form
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);

  // Cart item quantity updates
  updateCartDisplay();

  // Subscribe to cart changes
  Cart.subscribe(() => {
    updateCartDisplay();
  });
}

/**
 * Update cart display
 */
function updateCartDisplay() {
  const items = Cart.getItems();
  const cartItemsContainer = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const subtotal = document.getElementById('subtotal');
  const taxAmount = document.getElementById('taxAmount');
  const totalAmount = document.getElementById('totalAmount');

  if (!cartItemsContainer || !cartCount || !subtotal || !totalAmount) {
    return;
  }

  // Update count
  cartCount.textContent = items.length;

  // Update totals
  const subtotalValue = Cart.getSubtotal();
  const taxValue = Cart.getTax();
  const totalValue = Cart.getTotal();

  subtotal.textContent = formatPrice(subtotalValue);
  if (taxAmount) {
    taxAmount.textContent = formatPrice(taxValue);
  }
  totalAmount.textContent = formatPrice(totalValue);

  // Display items or empty state
  if (items.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">📭</div>
        <p>Your cart is empty</p>
      </div>
    `;
    document.getElementById('checkoutForm').style.display = 'none';
    return;
  }

  document.getElementById('checkoutForm').style.display = 'flex';

  cartItemsContainer.innerHTML = items.map(item => {
    const product = Products.getById(item.id);
    const inventory = getProductInventoryMeta(product || item || {});
    const maxStock = inventory.quantityOnHand;
    const maxSalesQuantity = convertBaseToSales(maxStock, inventory.baseUnit, item.soldUnit || inventory.salesUnit);
    const step = Number(item.saleStep || inventory.saleStep || 1);
    const inputStep = inventory.inventoryType === 'weight' ? step : 1;
    return `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-header">
        <div class="cart-item-name">${item.name}</div>
        <button type="button" class="cart-item-remove" data-id="${item.id}">×</button>
      </div>
      <div class="cart-item-price">${formatPrice(item.price)}</div>
      <div class="cart-item-stock" style="font-size: 12px; color: var(--gray-500);">Stock: ${formatQuantity(maxSalesQuantity, item.soldUnit || inventory.salesUnit)}</div>
      <div class="cart-item-qty">
        <button type="button" class="qty-decrease" data-id="${item.id}">−</button>
        <input type="number" value="${item.quantity}" min="${inputStep}" step="${inputStep}" max="${Math.max(inputStep, maxSalesQuantity)}" data-id="${item.id}" class="qty-input">
        <button type="button" class="qty-increase" data-id="${item.id}">+</button>
      </div>
    </div>
  `;
  }).join('');

  // Attach event handlers
  cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      Cart.removeItem(id);
      updateCartDisplay();
    });
  });

  cartItemsContainer.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const item = Cart.getItems().find(i => i.id === id);
      if (item) {
        const product = Products.getById(id);
        const inventory = getProductInventoryMeta(product || item || {});
        const step = Number(item.saleStep || inventory.saleStep || 1);
        const nextQuantity = toStep(Number(item.quantity || 0) + step, step, inventory.inventoryType);
        const nextBaseQuantity = convertSalesToBase(nextQuantity, item.soldUnit || inventory.salesUnit, inventory.baseUnit);

        if (nextBaseQuantity > inventory.quantityOnHand) {
          const availableSales = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, item.soldUnit || inventory.salesUnit);
          showNotification(`Cannot exceed available stock (${formatQuantity(availableSales, item.soldUnit || inventory.salesUnit)})`, 'error');
          return;
        }

        Cart.updateQuantity(id, nextQuantity);
      }
    });
  });

  cartItemsContainer.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const item = Cart.getItems().find(i => i.id === id);
      if (item) {
        const product = Products.getById(id);
        const inventory = getProductInventoryMeta(product || item || {});
        const step = Number(item.saleStep || inventory.saleStep || 1);
        const minQuantity = inventory.inventoryType === 'weight' ? step : 1;
        const nextQuantity = toStep(Number(item.quantity || 0) - step, step, inventory.inventoryType);

        if (nextQuantity < minQuantity) {
          Cart.removeItem(id);
          return;
        }

        Cart.updateQuantity(id, nextQuantity);
      }
    });
  });

  cartItemsContainer.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = input.dataset.id;
      const requestedQuantity = parseFloat(input.value);
      const item = Cart.getItems().find(i => i.id === id);
      const product = Products.getById(id);
      const inventory = getProductInventoryMeta(product || item || {});
      const step = Number(item?.saleStep || inventory.saleStep || 1);
      const minQuantity = inventory.inventoryType === 'weight' ? step : 1;
      const normalizedQuantity = toStep(requestedQuantity, step, inventory.inventoryType);
      const maxQuantity = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, item?.soldUnit || inventory.salesUnit);
      const safeQuantity = Math.min(Math.max(minQuantity, normalizedQuantity), Math.max(minQuantity, maxQuantity));

      if (normalizedQuantity > maxQuantity) {
        showNotification(`Cannot exceed available stock (${formatQuantity(maxQuantity, item?.soldUnit || inventory.salesUnit)})`, 'error');
      }

      input.value = String(safeQuantity);
      Cart.updateQuantity(id, safeQuantity);
    });
  });
}

/**
 * Handle checkout
 */
async function handleCheckout(e) {
  e.preventDefault();

  if (Cart.isEmpty()) {
    showNotification('Cart is empty', 'error');
    return;
  }

  const paymentMethod = document.getElementById('paymentMethod').value;
  const amountPaid = parseFloat(document.getElementById('amountPaid').value);

  if (!paymentMethod) {
    showNotification('Please select a payment method', 'error');
    return;
  }

  if (!amountPaid || amountPaid <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }

  const total = Cart.getTotal();
  if (amountPaid < total) {
    showNotification(`Insufficient amount. Total: ${formatPrice(total)}`, 'error');
    return;
  }

  try {
    await Products.fetchAll();

    const currentCartItems = Cart.getItems();
    for (const cartItem of currentCartItems) {
      const latestProduct = Products.getById(cartItem.id);

      if (!latestProduct) {
        showNotification(`Product not found: ${cartItem.name}`, 'error');
        return;
      }

      const inventory = getProductInventoryMeta(latestProduct);
      const requestedBaseQuantity = convertSalesToBase(cartItem.quantity, cartItem.soldUnit || inventory.salesUnit, inventory.baseUnit);

      if (requestedBaseQuantity > inventory.quantityOnHand) {
        const availableSales = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, cartItem.soldUnit || inventory.salesUnit);
        showNotification(`Insufficient stock for ${cartItem.name}. Available: ${formatQuantity(availableSales, cartItem.soldUnit || inventory.salesUnit)}`, 'error');
        return;
      }
    }

    const user = Auth.getCurrentUser();
    const items = currentCartItems.map(item => {
      const product = Products.getById(item.id);
      const inventory = getProductInventoryMeta(product || item || {});
      const soldUnit = item.soldUnit || inventory.salesUnit;
      const baseQuantity = convertSalesToBase(item.quantity, soldUnit, inventory.baseUnit);

      return {
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        soldUnit,
        baseQuantity,
        subtotal: item.price * item.quantity,
      };
    });

    const transactionData = {
      items,
      paymentMethod,
      amountPaid,
      cashierId: user.id || user.email,
      cashierName: user.name,
      subtotal: Cart.getSubtotal(),
      tax: Cart.getTax(),
      total,
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    const response = await API.createTransaction(transactionData);

    if (response.success) {
      showNotification('Transaction completed successfully!', 'success');

      await Products.fetchAll();
      
      // Print receipt
      setTimeout(() => {
        printReceipt(response.data, transactionData);
      }, 500);

      // Clear cart and form
      Cart.clear();
      document.getElementById('checkoutForm').reset();
      updateCartDisplay();
      document.getElementById('searchInput').value = '';
      displayProducts(Products.getAll());
    } else {
      showNotification(response.error || 'Transaction failed', 'error');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Checkout';
  } catch (error) {
    console.error('Checkout error:', error);
    showNotification(error.message || 'Checkout failed', 'error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Checkout';
  }
}

/**
 * Print receipt
 */
function printReceipt(transaction, data) {
  const receiptWindow = window.open('', 'receipt', 'width=400,height=600');
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        body { font-family: monospace; width: 58mm; margin: 0; padding: 10px; }
        .receipt { text-align: center; }
        .header { margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
        h2 { margin: 5px 0; }
        .items { text-align: left; margin: 15px 0; border-bottom: 2px dashed #000; padding-bottom: 10px; }
        .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
        .total-section { margin-top: 10px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
        .footer { font-size: 11px; margin-top: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h2>KANALA Sayur & Sembako</h2>
          <p>Nota</p>
        </div>
        
        <div style="text-align: left; font-size: 11px; margin-bottom: 10px;">
          <p>Kasir: ${data.cashierName}</p>
          <p>Tanggal: ${new Date().toLocaleString()}</p>
        </div>

        <div class="items">
          ${data.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity} ${item.soldUnit || ''}</span>
              <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatPrice(data.subtotal)}</span>
          </div>
          <div class="total-row" style="font-size: 14px;">
            <span>TOTAL:</span>
            <span>${formatPrice(data.total)}</span>
          </div>
          <div class="total-row">
            <span>Payment:</span>
            <span>${data.paymentMethod.toUpperCase()}</span>
          </div>
          <div class="total-row">
            <span>Pembayaran:</span>
            <span>${formatPrice(data.amountPaid)}</span>
          </div>
          <div class="total-row">
            <span>Kembalian:</span>
            <span>${formatPrice(data.amountPaid - data.total)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Terima kasih telah berbelanja!</p>
          <p>Transaction ID: ${transaction.id || 'N/A'}</p>
        </div>
      </div>
      <script>
        window.print();
      </script>
    </body>
    </html>
  `;

  receiptWindow.document.write(receiptHtml);
  receiptWindow.document.close();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Create alert if it doesn't exist
  let alertEl = document.getElementById('notification');
  if (!alertEl) {
    alertEl = document.createElement('div');
    alertEl.id = 'notification';
    alertEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(alertEl);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  alertEl.textContent = message;
  
  if (type === 'success') {
    alertEl.style.background = '#dcfce7';
    alertEl.style.color = '#166534';
    alertEl.style.border = '1px solid #bbf7d0';
  } else if (type === 'error') {
    alertEl.style.background = '#fee2e2';
    alertEl.style.color = '#991b1b';
    alertEl.style.border = '1px solid #fecaca';
  } else {
    alertEl.style.background = '#dbeafe';
    alertEl.style.color = '#0c4a6e';
    alertEl.style.border = '1px solid #bfdbfe';
  }

  // Auto-hide after 4 seconds
  setTimeout(() => {
    alertEl.remove();
  }, 4000);
}

/**
 * Format price for display
 */
function formatPrice(price) {
  return Formatter.formatCurrency(price);
}

/**
 * Initialize when page loads
 */
document.addEventListener('DOMContentLoaded', initPage);
