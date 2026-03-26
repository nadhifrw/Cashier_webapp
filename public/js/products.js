/**
 * Products Module
 * Handles product fetching, searching, and display
 */

const Products = {
  products: [],
  filteredProducts: [],

  normalizeProduct(product) {
    const inventoryType = product.inventoryType === 'weight' ? 'weight' : 'unit';
    const baseUnit = product.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
    const salesUnit = product.salesUnit === 'kg' || product.salesUnit === 'g'
      ? product.salesUnit
      : (inventoryType === 'weight' ? 'kg' : 'pcs');
    const quantityOnHand = Number(product.quantityOnHand ?? product.stock ?? 0);
    const defaultSaleStep = inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1;

    return {
      ...product,
      stock: quantityOnHand,
      quantityOnHand,
      inventoryType,
      baseUnit,
      salesUnit,
      saleStep: Number(product.saleStep ?? defaultSaleStep),
      lowStockThreshold: Number(product.lowStockThreshold ?? (inventoryType === 'weight' ? 1000 : 10)),
    };
  },

  /**
   * Fetch all products from API
   */
  async fetchAll() {
    try {
      const response = await API.getProducts();
      
      if (response.success && response.data) {
        this.products = response.data.map((product) => this.normalizeProduct(product));
        this.filteredProducts = [...this.products];
        return this.products;
      }
      
      throw new Error(response.error || 'Failed to fetch products');
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Search products by name or query
   */
  async search(query) {
    // If query is empty, always show all products
    if (!query || !query.trim()) {
      this.filteredProducts = [...this.products];
      return this.filteredProducts;
    }

    try {
      const response = await API.getProducts(query);
      
      if (response.success && response.data) {
        this.filteredProducts = response.data.map((product) => this.normalizeProduct(product));
        return this.filteredProducts;
      }
      
      // If API call doesn't succeed, fall back to client-side search
      const lowerQuery = query.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery))
      );
      return this.filteredProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      // Fallback to client-side search
      const lowerQuery = query.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery))
      );
      return this.filteredProducts;
    }
  },

  /**
   * Get product by ID
   */
  getById(id) {
    return this.products.find(product => product.id === id);
  },

  /**
   * Get filtered products
   */
  getFiltered() {
    return this.filteredProducts;
  },

  /**
   * Get all products
   */
  getAll() {
    return this.products;
  },

  /**
   * Format price for display
   */
  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  },
};
