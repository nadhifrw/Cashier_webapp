/**
 * Admin Page Logic
 * Handles product management, user registration, and dashboard
 */

let products = [];
let users = [];
let transactions = [];
let lowStockItems = [];
let editingProductId = null;

function getProductInventoryMeta(product) {
  const inventoryType = product.inventoryType === 'weight' ? 'weight' : 'unit';
  const baseUnit = product.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
  const salesUnit = product.salesUnit === 'kg' || product.salesUnit === 'g'
    ? product.salesUnit
    : (inventoryType === 'weight' ? 'kg' : 'pcs');
  const quantityOnHand = Number(product.quantityOnHand ?? product.stock ?? 0);
  const lowStockThreshold = Number(product.lowStockThreshold ?? (inventoryType === 'weight' ? 1000 : 10));
  return { inventoryType, baseUnit, salesUnit, quantityOnHand, lowStockThreshold };
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

function convertBaseToSales(baseQuantity, baseUnit, salesUnit) {
  const quantity = Number(baseQuantity || 0);
  if (baseUnit === 'g' && salesUnit === 'kg') return quantity / 1000;
  return quantity;
}

function syncProductUnitFields() {
  const inventoryType = document.getElementById('productInventoryType').value;
  const salesUnitSelect = document.getElementById('productSalesUnit');
  const thresholdInput = document.getElementById('productLowStockThreshold');
  const stockInput = document.getElementById('productStock');

  if (inventoryType === 'weight') {
    salesUnitSelect.innerHTML = '<option value="kg">kg</option><option value="g">g</option>';
    if (!salesUnitSelect.value || salesUnitSelect.value === 'pcs') {
      salesUnitSelect.value = 'kg';
    }
    if (!thresholdInput.value) thresholdInput.value = '1';
    stockInput.step = '0.01';
  } else {
    salesUnitSelect.innerHTML = '<option value="pcs">pcs</option>';
    salesUnitSelect.value = 'pcs';
    if (!thresholdInput.value) thresholdInput.value = '10';
    stockInput.step = '1';
  }
}

/**
 * Initialize admin page
 */
async function initAdmin() {
  // Check authentication and admin role
  Auth.requireAdmin();

  // Set user info
  const user = Auth.getCurrentUser();
  document.getElementById('userName').textContent = user.name || 'Admin';

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadDashboard();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      Auth.logout();
    }
  });

  // Product form
  document.getElementById('addProductBtn').addEventListener('click', showAddProductForm);
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
  document.getElementById('productInventoryType').addEventListener('change', syncProductUnitFields);

  // User form
  document.getElementById('registerUserBtn').addEventListener('click', showRegisterUserForm);
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
}

/**
 * Switch between sections
 */
function switchSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  // Remove active from nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected section
  document.getElementById(sectionId).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

  // Load data for section
  if (sectionId === 'dashboard') loadDashboard();
  else if (sectionId === 'products') loadProducts();
  else if (sectionId === 'users') loadUsers();
  else if (sectionId === 'transactions') loadTransactions();
}

function getLocalDateKey(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayDateKey() {
  return getLocalDateKey(new Date());
}

function getTodayTransactions(list = transactions) {
  const todayKey = getTodayDateKey();
  return (list || []).filter(transaction => {
    if (!transaction || !transaction.createdAt) return false;
    return getLocalDateKey(transaction.createdAt) === todayKey;
  });
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
  try {
    // Load all data
    const results = await Promise.allSettled([
      loadProducts(),
      loadUsers(),
      loadTransactions(),
      loadLowStockProducts()
    ]);

    // Log results for debugging
    results.forEach((result, index) => {
      const names = ['Products', 'Users', 'Transactions', 'Low stock'];
      if (result.status === 'rejected') {
        console.error(`Failed to load ${names[index]}:`, result.reason);
      }
    });

    // Update stats
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalUsers').textContent = users.length;
    const todayTransactions = getTodayTransactions(transactions);
    document.getElementById('totalTransactions').textContent = todayTransactions.length;
    document.getElementById('totalLowStock').textContent = lowStockItems.length;
    renderLowStockList();

    // Show warning if important data failed to load
    if (products.length === 0) {
      showNotification('⚠️ Could not load products. Check permissions.', 'error');
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('Failed to load dashboard data', 'error');
  }
}

/**
 * Load products from API
 */
async function loadProducts() {
  try {
    const response = await API.getProducts();
    if (response && response.success && response.data) {
      products = response.data;
      displayProducts();
    } else if (response && response.data) {
      // Handle case where success flag isn't set but data exists
      products = response.data;
      displayProducts();
    } else {
      console.warn('No product data received');
      displayProducts([]);
    }
  } catch (error) {
    console.error('Error loading products:', error.message);
    showNotification(`Error loading products: ${error.message}`, 'error');
    displayProducts([]);
  }
}

async function loadLowStockProducts() {
  try {
    const response = await API.getLowStockProducts();
    if (response && response.success && response.data) {
      lowStockItems = response.data;
    } else if (response && response.data) {
      lowStockItems = response.data;
    } else {
      lowStockItems = [];
    }
  } catch (error) {
    console.warn('Error loading low stock products:', error.message);
    lowStockItems = [];
  }
}

function renderLowStockList() {
  const lowStockList = document.getElementById('lowStockList');
  if (!lowStockList) return;

  if (!lowStockItems || lowStockItems.length === 0) {
    lowStockList.innerHTML = '<li class="low-stock-empty">No low stock items.</li>';
    return;
  }

  lowStockList.innerHTML = lowStockItems.map(product => `
    <li class="low-stock-item">
      <strong>${product.name || product.id}</strong>
      <span>${(() => {
        const inventory = getProductInventoryMeta(product);
        const salesQuantity = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, inventory.salesUnit);
        return `Stock: ${formatQuantity(salesQuantity, inventory.salesUnit)}`;
      })()}</span>
    </li>
  `).join('');
}

/**
 * Display products in table
 */
function displayProducts() {
  const tbody = document.getElementById('productsTableBody');

  if (!products || products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-500); padding: 40px;">
          No products found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${formatPrice(product.price)}</td>
      <td>${(() => {
        const inventory = getProductInventoryMeta(product);
        const salesQuantity = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, inventory.salesUnit);
        return formatQuantity(salesQuantity, inventory.salesUnit);
      })()}</td>
      <td>${product.inventoryType === 'weight' ? 'Weight' : 'Unit'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-small edit" onclick="editProduct('${product.id}')">Edit</button>
          <button class="btn-small delete" onclick="deleteProduct('${product.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Show add product form
 */
function showAddProductForm() {
  editingProductId = null;
  document.getElementById('productFormTitle').textContent = 'Add New Product';
  document.getElementById('productFormDesc').textContent = 'Create a new product';
  document.getElementById('productForm').reset();
  document.getElementById('productInventoryType').value = 'unit';
  document.getElementById('productLowStockThreshold').value = '10';
  syncProductUnitFields();
  document.getElementById('productId').disabled = false;
  document.getElementById('productFormContainer').style.display = 'block';
}

/**
 * Edit product
 */
function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  editingProductId = productId;
  document.getElementById('productFormTitle').textContent = 'Edit Product';
  document.getElementById('productFormDesc').textContent = 'Update product information';
  document.getElementById('productId').value = product.id;
  document.getElementById('productId').disabled = true;
  document.getElementById('productName').value = product.name;
  document.getElementById('productPrice').value = product.price;
  const inventory = getProductInventoryMeta(product);
  document.getElementById('productInventoryType').value = inventory.inventoryType;
  syncProductUnitFields();
  document.getElementById('productSalesUnit').value = inventory.salesUnit;
  const salesQuantity = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, inventory.salesUnit);
  document.getElementById('productStock').value = salesQuantity;
  document.getElementById('productLowStockThreshold').value = convertBaseToSales(inventory.lowStockThreshold, inventory.baseUnit, inventory.salesUnit);
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productFormContainer').style.display = 'block';
  document.querySelector('#productFormContainer button[type="submit"]').textContent = 'Update Product';
}

/**
 * Cancel product form
 */
function cancelProductForm() {
  document.getElementById('productFormContainer').style.display = 'none';
  document.getElementById('productForm').reset();
  editingProductId = null;
}

/**
 * Handle product form submission
 */
async function handleProductSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById('productId').value.trim();
  const name = document.getElementById('productName').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const quantityOnHandInput = parseFloat(document.getElementById('productStock').value);
  const inventoryType = document.getElementById('productInventoryType').value;
  const salesUnit = document.getElementById('productSalesUnit').value;
  const lowStockThresholdInput = parseFloat(document.getElementById('productLowStockThreshold').value);
  const description = document.getElementById('productDescription').value.trim();

  const toBaseQuantity = (quantity, unit) => {
    if (inventoryType !== 'weight') return quantity;
    if (unit === 'kg') return quantity * 1000;
    return quantity;
  };

  const quantityOnHand = toBaseQuantity(quantityOnHandInput, salesUnit);
  const lowStockThreshold = toBaseQuantity(lowStockThresholdInput, salesUnit);
  const saleStep = inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1;
  const baseUnit = inventoryType === 'weight' ? 'g' : 'pcs';

  if (!productId || !name || !Number.isFinite(price) || !Number.isFinite(quantityOnHandInput) || !Number.isFinite(lowStockThresholdInput) || price < 0 || quantityOnHandInput < 0 || lowStockThresholdInput < 0) {
    showNotification('Please fill in all required fields correctly', 'error');
    return;
  }

  if (inventoryType === 'unit' && (!Number.isInteger(quantityOnHandInput) || !Number.isInteger(lowStockThresholdInput))) {
    showNotification('Unit-based products must use whole numbers', 'error');
    return;
  }

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const productData = {
      id: productId,
      name,
      price,
      quantityOnHand,
      stock: quantityOnHand,
      inventoryType,
      baseUnit,
      salesUnit,
      lowStockThreshold,
      saleStep,
      description,
    };

    if (editingProductId) {
      // Update existing product
      await API.put(`/products/${editingProductId}`, productData);
      showNotification('Product updated successfully!', 'success');
    } else {
      // Create new product
      await API.post('/products', productData);
      showNotification('Product created successfully!', 'success');
    }

    cancelProductForm();
    await loadProducts();
    document.getElementById('totalProducts').textContent = products.length;
    await loadLowStockProducts();
    document.getElementById('totalLowStock').textContent = lowStockItems.length;
    renderLowStockList();

    submitBtn.disabled = false;
  } catch (error) {
    console.error('Error saving product:', error);
    showNotification(error.message || 'Failed to save product', 'error');
    e.target.querySelector('button[type="submit"]').disabled = false;
  }
}

/**
 * Delete product
 */
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    await API.delete(`/products/${productId}`);
    showNotification('Product deleted successfully!', 'success');
    await loadProducts();
    document.getElementById('totalProducts').textContent = products.length;
    await loadLowStockProducts();
    document.getElementById('totalLowStock').textContent = lowStockItems.length;
    renderLowStockList();
  } catch (error) {
    console.error('Error deleting product:', error);
    showNotification(error.message || 'Failed to delete product', 'error');
  }
}

/**
 * Load users from API
 */
async function loadUsers() {
  try {
    // Note: You'll need to create an endpoint to get all users
    // For now, this will show empty or mock data
    const response = await API.get('/auth/users');
    if (response.success && response.data) {
      users = response.data;
      displayUsers();
    }
  } catch (error) {
    console.warn('Users endpoint not available yet:', error);
    displayUsers([]);
  }
}

/**
 * Display users in table
 */
function displayUsers() {
  const tbody = document.getElementById('usersTableBody');

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-500); padding: 40px;">
          No users found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.username || 'N/A'}</td>
      <td><span class="badge ${user.role}">${user.role || 'N/A'}</span></td>
      <td><span class="badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('');
}

/**
 * Show register user form
 */
function showRegisterUserForm() {
  document.getElementById('userForm').reset();
  document.getElementById('userFormContainer').style.display = 'block';
}

/**
 * Cancel user form
 */
function cancelUserForm() {
  document.getElementById('userFormContainer').style.display = 'none';
  document.getElementById('userForm').reset();
}

/**
 * Handle user registration form submission
 */
async function handleUserSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('userName').value.trim();
  const username = document.getElementById('userUsername').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;

  if (!name || !username || !email || !password || !role) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    const response = await API.post('/auth/register', {
      email,
      username,
      name,
      password,
      role
    });

    if (response.success) {
      showNotification(`User ${name} registered successfully!`, 'success');
      cancelUserForm();
      await loadUsers();
      document.getElementById('totalUsers').textContent = users.length;
    } else {
      showNotification(response.error || 'Failed to register user', 'error');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Register User';
  } catch (error) {
    console.error('Error registering user:', error);
    showNotification(error.message || 'Failed to register user', 'error');
    e.target.querySelector('button[type="submit"]').disabled = false;
    e.target.querySelector('button[type="submit"]').textContent = 'Register User';
  }
}

/**
 * Load transactions from API
 */
async function loadTransactions() {
  try {
    const response = await API.getTransactions();
    if (response && response.success && response.data) {
      transactions = [...response.data].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      displayTransactions();
    } else if (response && response.data) {
      // Handle case where success flag isn't set but data exists
      transactions = [...response.data].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      displayTransactions();
    } else {
      console.warn('No transaction data received');
      displayTransactions([]);
    }
  } catch (error) {
    console.warn('Error loading transactions:', error.message);
    displayTransactions([]);
  }
}

/**
 * Display transactions in table
 */
function displayTransactions() {
  const tbody = document.getElementById('transactionsTableBody');
  const todayTransactions = getTodayTransactions(transactions);

  if (!todayTransactions || todayTransactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray-500); padding: 40px;">
          No transactions found for today
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = todayTransactions.map(transaction => `
    <tr>
      <td>${transaction.id || 'N/A'}</td>
      <td>${transaction.cashierName || 'N/A'}</td>
      <td>${transaction.items ? transaction.items.length : 0}</td>
      <td>${formatPrice(transaction.total || 0)}</td>
      <td>${transaction.paymentMethod || 'N/A'}</td>
      <td>${transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('');
}

/**
 * Format price for display
 */
function formatPrice(price) {
  return Formatter.formatCurrency(price);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  let alertEl = document.getElementById('notification');
  if (!alertEl) {
    alertEl = document.createElement('div');
    alertEl.id = 'notification';
    alertEl.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(alertEl);
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

  setTimeout(() => {
    alertEl.remove();
  }, 4000);
}

/**
 * Load report data based on selected report type
 */
async function loadReportData() {
  const reportType = document.getElementById('reportType').value;
  const resultsDiv = document.getElementById('reportResults');

  // Show loading state
  resultsDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div> Generating report...</div>';

  try {
    let report = null;

    if (reportType === 'daily') {
      const dateInput = document.getElementById('dailyDate').value;
      if (!dateInput) {
        showNotification('Please select a date', 'error');
        resultsDiv.innerHTML = '<div style="text-align: center; color: var(--gray-500); padding: 40px;">Select a date to generate report</div>';
        return;
      }
      const response = await API.getDailyReport(dateInput);
      report = response.data;
      displayDailyReport(report, resultsDiv);
    } else if (reportType === 'monthly') {
      const monthInput = document.getElementById('monthYear').value;
      if (!monthInput) {
        showNotification('Please select a month', 'error');
        resultsDiv.innerHTML = '<div style="text-align: center; color: var(--gray-500); padding: 40px;">Select a month to generate report</div>';
        return;
      }
      const [year, month] = monthInput.split('-');
      const response = await API.getMonthlyReport(year, month);
      report = response.data;
      displayMonthlyReport(report, resultsDiv);
    } else if (reportType === 'inventory-status') {
      const response = await API.getProducts();
      const inventoryProducts = response?.data || [];
      displayInventoryStatusReport(inventoryProducts, resultsDiv);
    } else if (reportType === 'cashier-performance') {
      const startDate = document.getElementById('startDate').value || getDefaultStartDate();
      const endDate = document.getElementById('endDate').value || new Date().toISOString().split('T')[0];
      const response = await API.getCashierPerformanceReport(startDate, endDate);
      report = response.data;
      displayCashierPerformanceReport(report, resultsDiv);
    } else if (reportType === 'revenue-trend') {
      const days = document.getElementById('trendDays').value;
      const response = await API.getRevenueTrend(days);
      report = response.data;
      displayRevenueTrendReport(report, resultsDiv);
    }

    showNotification('Report generated successfully', 'success');
  } catch (error) {
    console.error('Error loading report:', error);
    showNotification(error.message || 'Failed to generate report', 'error');
    resultsDiv.innerHTML = '<div style="text-align: center; color: var(--gray-500); padding: 40px;">Error generating report. Check console for details.</div>';
  }
}

/**
 * Get default start date (30 days ago)
 */
function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

/**
 * Update report filter visibility based on report type
 */
document.addEventListener('DOMContentLoaded', function() {
  const reportType = document.getElementById('reportType');
  if (reportType) {
    reportType.addEventListener('change', function() {
      document.getElementById('dailyFilter').style.display = this.value === 'daily' ? 'block' : 'none';
      document.getElementById('monthlyFilter').style.display = this.value === 'monthly' ? 'block' : 'none';
      document.getElementById('dateRangeFilter').style.display = ['cashier-performance'].includes(this.value) ? 'block' : 'none';
      document.getElementById('trendFilter').style.display = this.value === 'revenue-trend' ? 'block' : 'none';
    });

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dailyDate = document.getElementById('dailyDate');
    if (dailyDate) dailyDate.value = today;

    const monthYear = document.getElementById('monthYear');
    if (monthYear) monthYear.value = today.substring(0, 7);

    const startDate = document.getElementById('startDate');
    if (startDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
    }

    const endDate = document.getElementById('endDate');
    if (endDate) endDate.value = today;
  }
});

/**
 * Display daily report
 */
function displayDailyReport(report, container) {
  const html = `
    <div class="report-card">
      <h3>Daily Sales Report - ${report.date}</h3>
      <div class="report-summary">
        <div class="summary-item">
          <span class="label">Total Transactions:</span>
          <span class="value">${report.totalTransactions}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Revenue:</span>
          <span class="value">${Formatter.formatCurrency(report.totalRevenue)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Items Sold:</span>
          <span class="value">${report.totalItemsSold}</span>
        </div>
        <div class="summary-item">
          <span class="label">Average Transaction:</span>
          <span class="value">${Formatter.formatCurrency(report.averageTransactionValue)}</span>
        </div>
      </div>

      <h4>Payment Method Breakdown</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Payment Method</th>
            <th>Count</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(report.paymentBreakdown).map(([method, data]) => `
            <tr>
              <td>${Formatter.formatPaymentMethod(method)}</td>
              <td>${data.count}</td>
              <td>${Formatter.formatCurrency(data.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4>Top Products</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity Sold</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${report.topProducts.length > 0 ? report.topProducts.map((product, index) => `
            <tr>
              <td>${index + 1}. ${product.name}</td>
              <td>${Formatter.formatCurrency(product.price)}</td>
              <td>${product.quantity}</td>
              <td>${Formatter.formatCurrency(product.revenue)}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" style="text-align: center;">No products sold</td></tr>'}
        </tbody>
      </table>

      <button class="btn btn-primary" style="margin-top: 20px;" onclick="exportReportToCSV('daily-report', 'Daily Sales Report')">📥 Export to CSV</button>
    </div>
  `;
  container.innerHTML = html;
}

/**
 * Display monthly report
 */
function displayMonthlyReport(report, container) {
  const monthName = new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const html = `
    <div class="report-card">
      <h3>Monthly Sales Report - ${monthName}</h3>
      <div class="report-summary">
        <div class="summary-item">
          <span class="label">Total Transactions:</span>
          <span class="value">${report.totalTransactions}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Revenue:</span>
          <span class="value">${Formatter.formatCurrency(report.totalRevenue)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Items Sold:</span>
          <span class="value">${report.totalItemsSold}</span>
        </div>
        <div class="summary-item">
          <span class="label">Average Transaction:</span>
          <span class="value">${Formatter.formatCurrency(report.averageTransactionValue)}</span>
        </div>
      </div>

      <h4>Payment Method Breakdown</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Payment Method</th>
            <th>Count</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(report.paymentBreakdown).map(([method, data]) => `
            <tr>
              <td>${Formatter.formatPaymentMethod(method)}</td>
              <td>${data.count}</td>
              <td>${Formatter.formatCurrency(data.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h4>Daily Breakdown</h4>
      <table class="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Transactions</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(report.dailyBreakdown)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, data]) => `
            <tr>
              <td>${new Date(date).toLocaleDateString()}</td>
              <td>${data.transactions}</td>
              <td>${Formatter.formatCurrency(data.revenue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <button class="btn btn-primary" style="margin-top: 20px;" onclick="exportReportToCSV('monthly-report', 'Monthly Sales Report')">📥 Export to CSV</button>
    </div>
  `;
  container.innerHTML = html;
}

/**
 * Display inventory status report
 */
function displayInventoryStatusReport(productsList, container) {
  const normalizedProducts = (productsList || []).map(product => {
    const inventory = getProductInventoryMeta(product);
    const stockInSalesUnit = convertBaseToSales(inventory.quantityOnHand, inventory.baseUnit, inventory.salesUnit);
    const thresholdInSalesUnit = convertBaseToSales(inventory.lowStockThreshold, inventory.baseUnit, inventory.salesUnit);
    const needsRestock = Number(inventory.quantityOnHand) <= Number(inventory.lowStockThreshold);

    return {
      id: product.id,
      name: product.name,
      salesUnit: inventory.salesUnit,
      stockInSalesUnit,
      thresholdInSalesUnit,
      needsRestock,
    };
  });

  const totalItems = normalizedProducts.length;
  const restockItems = normalizedProducts.filter(item => item.needsRestock).length;
  const healthyItems = totalItems - restockItems;

  const html = `
    <div class="report-card">
      <h3>Inventory Status</h3>

      <div class="report-summary">
        <div class="summary-item">
          <span class="label">Total Items:</span>
          <span class="value">${totalItems}</span>
        </div>
        <div class="summary-item">
          <span class="label">Need Restock:</span>
          <span class="value">${restockItems}</span>
        </div>
        <div class="summary-item">
          <span class="label">Stock Healthy:</span>
          <span class="value">${healthyItems}</span>
        </div>
      </div>

      <table class="report-table">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Stock Left</th>
            <th>Restock Threshold</th>
            <th>Need Restock</th>
          </tr>
        </thead>
        <tbody>
          ${normalizedProducts.length > 0 ? normalizedProducts.map((product) => `
            <tr>
              <td>${product.id || '-'}</td>
              <td>${product.name}</td>
              <td>${formatQuantity(product.stockInSalesUnit, product.salesUnit)}</td>
              <td>${formatQuantity(product.thresholdInSalesUnit, product.salesUnit)}</td>
              <td>
                <span class="stock-status ${product.needsRestock ? 'restock' : 'healthy'}">
                  ${product.needsRestock ? 'Yes' : 'No'}
                </span>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="5" style="text-align: center;">No products found</td></tr>'}
        </tbody>
      </table>

      <button class="btn btn-primary" style="margin-top: 20px;" onclick="exportReportToCSV('inventory-status', 'Inventory Status Report')">📥 Export to CSV</button>
    </div>
  `;
  container.innerHTML = html;
}

/**
 * Display cashier performance report
 */
function displayCashierPerformanceReport(report, container) {
  const html = `
    <div class="report-card">
      <h3>Cashier Performance Report</h3>
      <p style="color: var(--gray-500); margin-bottom: 20px;">Period: ${report.period.startDate} to ${report.period.endDate}</p>

      <table class="report-table">
        <thead>
          <tr>
            <th>Cashier Name</th>
            <th>Transactions</th>
            <th>Items Sold</th>
            <th>Total Revenue</th>
            <th>Avg Transaction Value</th>
          </tr>
        </thead>
        <tbody>
          ${report.cashiers.map(cashier => `
            <tr>
              <td>${cashier.cashierName}</td>
              <td>${cashier.totalTransactions}</td>
              <td>${cashier.totalItemsSold}</td>
              <td>${Formatter.formatCurrency(cashier.totalRevenue)}</td>
              <td>${Formatter.formatCurrency(cashier.averageTransactionValue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <button class="btn btn-primary" style="margin-top: 20px;" onclick="exportReportToCSV('cashier-performance', 'Cashier Performance Report')">📥 Export to CSV</button>
    </div>
  `;
  container.innerHTML = html;
}

/**
 * Display revenue trend report
 */
function displayRevenueTrendReport(report, container) {
  const html = `
    <div class="report-card">
      <h3>Revenue Trend</h3>
      
      <table class="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          ${report.map((item, index) => {
            let trend = '→';
            if (index > 0) {
              if (item.revenue > report[index - 1].revenue) {
                trend = '📈 Up';
              } else if (item.revenue < report[index - 1].revenue) {
                trend = '📉 Down';
              }
            }
            return `
              <tr>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>${Formatter.formatCurrency(item.revenue)}</td>
                <td>${trend}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="report-summary" style="margin-top: 20px;">
        <div class="summary-item">
          <span class="label">Total Revenue:</span>
          <span class="value">${Formatter.formatCurrency(report.length > 0 ? report.reduce((sum, item) => sum + item.revenue, 0) : 0)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Average Daily Revenue:</span>
          <span class="value">${Formatter.formatCurrency(report.length > 0 ? report.reduce((sum, item) => sum + item.revenue, 0) / report.length : 0)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Highest Day:</span>
          <span class="value">${Formatter.formatCurrency(report.length > 0 ? Math.max(...report.map(item => item.revenue)) : 0)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Lowest Day:</span>
          <span class="value">${Formatter.formatCurrency(report.length > 0 ? Math.min(...report.map(item => item.revenue)) : 0)}</span>
        </div>
      </div>

      <button class="btn btn-primary" style="margin-top: 20px;" onclick="exportReportToCSV('revenue-trend', 'Revenue Trend Report')">📥 Export to CSV</button>
    </div>
  `;
  container.innerHTML = html;
}

/**
 * Export report table to CSV
 */
function exportReportToCSV(reportId, fileName = 'report') {
  try {
    const table = document.querySelector('.report-table');
    if (!table) {
      showNotification('No table found to export', 'error');
      return;
    }

    // Get headers
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
      headers.push(th.textContent.trim());
    });

    // Get rows
    const rows = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td').forEach(td => {
        row.push('"' + td.textContent.trim().replace(/"/g, '""') + '"');
      });
      rows.push(row.join(','));
    });

    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Report exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting report:', error);
    showNotification('Failed to export report', 'error');
  }
}

/**
 * Initialize when page loads
 */
document.addEventListener('DOMContentLoaded', initAdmin);
