// SHOULD BE FINE NOTHING NEED TO BE CHANGED HERE

/**
 * Products Module
 * Handles product fetching, searching, and display
 */

const Products = {
  products: [],
  filteredProducts: [],
  pagination: {
    hasMore: false,
    nextCursor: null,
  },

  normalizeProduct(product) {
    const inventoryType = product.inventoryType === 'weight' ? 'weight' : 'unit';
    const baseUnit = product.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
    const salesUnit = product.salesUnit === 'kg' || product.salesUnit === 'g'
      ? product.salesUnit
      : (inventoryType === 'weight' ? 'kg' : 'pcs');
    const quantityOnHand = Number(product.quantityOnHand ?? product.stock ?? 0);
    const defaultSaleStep = inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.01 : 0.01) : 1;
    const rawSaleStep = Number(product.saleStep);
    const isLegacyGramStep = inventoryType === 'weight' && salesUnit === 'g' && rawSaleStep >= 10;
    const normalizedSaleStep = Number.isFinite(rawSaleStep) && rawSaleStep > 0 && !isLegacyGramStep
      ? rawSaleStep
      : defaultSaleStep;

    return {
      ...product,
      stock: quantityOnHand,
      quantityOnHand,
      inventoryType,
      baseUnit,
      salesUnit,
      saleStep: normalizedSaleStep,
      lowStockThreshold: Number(product.lowStockThreshold ?? (inventoryType === 'weight' ? 1000 : 10)),
    };
  },

  /**
   * Fetch all products from API (supports pagination)
   * @param {number} limit
   * @param {string|null} startAfter
   * @param {boolean} append
   */
  async fetchAll(limit = 10, startAfter = null, append = false) {
    try {
      const response = await API.getProducts(null, limit, startAfter);

      if (response.success && response.data) {
        const fetched = response.data.map((product) => this.normalizeProduct(product));
        if (append) {
          // avoid duplicates
          const existingIds = new Set(this.products.map(p => p.id));
          for (const p of fetched) {
            if (!existingIds.has(p.id)) this.products.push(p);
          }
        } else {
          this.products = fetched;
        }

        // update filtered list and pagination
        this.filteredProducts = [...this.products];
        this.pagination.hasMore = response.pagination?.hasMore ?? false;
        this.pagination.nextCursor = response.pagination?.nextCursor ?? null;

        return fetched;
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
