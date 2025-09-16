import { useState, useEffect } from 'react';
import { Product } from './useProducts';

export interface CartItem {
  product_id: string;
  product: Product;
  quantity: number;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage and broadcast updates whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    // Notify other components in this tab
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
  }, [items]);

  // Listen for cart updates from other components or tabs
  useEffect(() => {
    const onCartUpdated = (e: Event) => {
      try {
        const detail = (e as CustomEvent<CartItem[]>).detail;
        if (Array.isArray(detail)) {
          setItems(detail);
        }
      } catch (_) {}
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    window.addEventListener('cart:updated', onCartUpdated as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart:updated', onCartUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { product_id: product.id, product, quantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.product.price.replace(/[$,]/g, ''));
      return total + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotalPrice,
  };
};