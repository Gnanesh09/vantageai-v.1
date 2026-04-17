import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  itemIds: string[];
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      itemIds: [],
      toggleItem: (productId) => set((state) => {
        if (state.itemIds.includes(productId)) {
          return { itemIds: state.itemIds.filter(id => id !== productId) };
        }
        return { itemIds: [...state.itemIds, productId] };
      }),
      isInWishlist: (productId) => get().itemIds.includes(productId)
    }),
    { name: 'swiftcart-wishlist' }
  )
);
