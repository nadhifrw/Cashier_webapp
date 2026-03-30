/**
 * Formatter Module
 * Handles formatting for currency (IDR), dates, and other data types
 */

const Formatter = {
  // Currency formatting with IDR (Indonesian Rupiah)
  
  /**
   * Format number as Indonesian Rupiah (IDR)
   */
  formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  },

  /**
   * Convert currency string to number
   */
  parseCurrency(currencyString) {
    return parseInt(currencyString.replace(/[^\d]/g, ''), 10) || 0;
  },

  /**
   * Format number with thousand separator
   */
  formatNumber(value) {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
  },

  /**
   * Format date to Indonesian format (dd/mm/yyyy)
   */
  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Format date with time (dd/mm/yyyy HH:mm:ss)
   */
  formatDateTime(date) {
    const d = new Date(date);
    const dateStr = this.formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
  },

  /**
   * Format time only (HH:mm:ss)
   */
  formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * Format date to ISO format (yyyy-mm-dd)
   */
  formatISODate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Format percentage
   */
  formatPercentage(value, decimals = 2) {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(decimals)}%`;
  },

  /**
   * Format payment method display name
   */
  formatPaymentMethod(method) {
    const methodNames = {
      cash: 'Tunai',
      qris: 'QRIS',
    };
    return methodNames[method] || method;
  },

  /**
   * Format product name with truncation
   */
  formatProductName(name, maxLength = 20) {
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }
    return name;
  },

  /**
   * Format quantity with unit
   */
  formatQuantity(quantity, unit = 'pcs') {
    return `${quantity} ${unit}`;
  },

  /**
   * Format transaction ID
   */
  formatTransactionId(id) {
    if (id.length > 8) {
      return id.substring(0, 8).toUpperCase() + '...';
    }
    return id.toUpperCase();
  },

  /**
   * Format phone number (Indonesian)
   */
  formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return phone;
    
    const formatted = cleaned.replace(/(\d{2})(\d{4})(\d{4})(\d+)/, '+$1 $2 $3 $4');
    return formatted;
  },

  /**
   * Format discount amount
   */
  formatDiscount(originalPrice, discountPrice) {
    const discount = originalPrice - discountPrice;
    const percentage = ((discount / originalPrice) * 100).toFixed(0);
    return {
      amount: this.formatCurrency(discount),
      percentage: `${percentage}%`,
    };
  },

  /**
   * Format receipt header
   */
  formatReceiptHeader() {
    return `
    ╔════════════════════════════════╗
    ║      CASHIER APP SYSTEM        ║
    ║           RECEIPT              ║
    ╚════════════════════════════════╝
    `;
  },

  /**
   * Format receipt footer
   */
  formatReceiptFooter() {
    return `
    ════════════════════════════════
         Thank You! Come Again
    ════════════════════════════════
    ${this.formatDateTime(new Date())}
    `;
  },
};
