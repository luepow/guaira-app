import { create } from 'zustand';
import type { Cart, CartItem, Service } from '../types';

interface CartStore {
  cart: Cart;
  addItem: (service: Service, quantity?: number) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const initialCart: Cart = {
  items: [],
  total: 0,
  currency: 'USD',
};

export const useCartStore = create<CartStore>((set, get) => ({
  cart: initialCart,

  addItem: (service: Service, quantity: number = 1) => {
    set((state) => {
      const existingItemIndex = state.cart.items.findIndex(
        (item) => item.service.id === service.id
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...state.cart.items];
        const newQuantity = newItems[existingItemIndex].quantity + quantity;
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: service.price * newQuantity,
        };
      } else {
        // Add new item
        newItems = [
          ...state.cart.items,
          {
            service,
            quantity,
            subtotal: service.price * quantity,
          },
        ];
      }

      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        cart: {
          items: newItems,
          total,
          currency: service.currency,
        },
      };
    });
  },

  removeItem: (serviceId: string) => {
    set((state) => {
      const newItems = state.cart.items.filter(
        (item) => item.service.id !== serviceId
      );
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        cart: {
          ...state.cart,
          items: newItems,
          total,
        },
      };
    });
  },

  updateQuantity: (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(serviceId);
      return;
    }

    set((state) => {
      const newItems = state.cart.items.map((item) => {
        if (item.service.id === serviceId) {
          return {
            ...item,
            quantity,
            subtotal: item.service.price * quantity,
          };
        }
        return item;
      });

      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        cart: {
          ...state.cart,
          items: newItems,
          total,
        },
      };
    });
  },

  clearCart: () => {
    set({ cart: initialCart });
  },

  getTotal: () => {
    return get().cart.total;
  },
}));
