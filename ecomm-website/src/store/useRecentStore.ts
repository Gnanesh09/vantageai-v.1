import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/api/products';

interface RecentStore {
  recentItems: Product[];
  addRecent: (product: Product) => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      recentItems: [],
      addRecent: (product) => set((state) => {
        // Remove if exists to push to front
        const filtered = state.recentItems.filter(i => i.id !== product.id);
        const updated = [product, ...filtered].slice(0, 10); // Keep max 10
        return { recentItems: updated };
      }),
    }),
    { name: 'swiftcart-recent' }
  )
);
