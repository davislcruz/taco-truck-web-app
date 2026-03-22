/**
 * Taco Truck Cart - Simple localStorage-based cart
 */

const Cart = {
    STORAGE_KEY: 'taco_truck_cart',
    
    /**
     * Get all cart items
     */
    getItems() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    /**
     * Save cart items
     */
    save(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        this.updateCartCount();
    },
    
    /**
     * Add item to cart
     */
    add(id, name, price, quantity = 1) {
        const items = this.getItems();
        const existing = items.find(item => item.id === id);
        
        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({ id, name, price, quantity });
        }
        
        this.save(items);
        return items;
    },
    
    /**
     * Update item quantity
     */
    update(id, quantity) {
        const items = this.getItems();
        const item = items.find(item => item.id === id);
        
        if (item) {
            if (quantity <= 0) {
                this.remove(id);
            } else {
                item.quantity = quantity;
                this.save(items);
            }
        }
        
        return items;
    },
    
    /**
     * Remove item from cart
     */
    remove(id) {
        const items = this.getItems().filter(item => item.id !== id);
        this.save(items);
        return items;
    },
    
    /**
     * Clear entire cart
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartCount();
    },
    
    /**
     * Get cart total
     */
    getTotal() {
        return this.getItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    /**
     * Get total item count
     */
    getCount() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    /**
     * Backwards-compatible alias (some templates used Cart.count())
     */
    count() {
        return this.getCount();
    },
    
    /**
     * Update cart count badge in nav
     */
    updateCartCount() {
        const badge = document.getElementById('cart-count');
        if (badge) {
            const count = this.getCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }
};

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCartCount();
});
