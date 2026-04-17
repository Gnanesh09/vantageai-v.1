import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/api/products';

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1) => set((state) => {
        const existingItem = state.items.find(i => i.id === product.id);
        if (existingItem) {
          return {
            items: state.items.map(i => 
              i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
            )
          };
        }
        return { items: [...state.items, { ...product, quantity: qty }] };
      }),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: quantity <= 0 
          ? state.items.filter(i => i.id !== productId)
          : state.items.map(i => i.id === productId ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'swiftcart-cart',
    }
  )
);
