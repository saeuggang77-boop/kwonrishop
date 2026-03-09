import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareStore {
  compareIds: string[];
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      compareIds: [],

      addToCompare: (id: string) => {
        const current = get().compareIds;
        if (current.includes(id)) {
          return true;
        }
        if (current.length >= 3) {
          return false;
        }
        set({ compareIds: [...current, id] });
        return true;
      },

      removeFromCompare: (id: string) => {
        set((state) => ({
          compareIds: state.compareIds.filter((cid) => cid !== id),
        }));
      },

      clearCompare: () => {
        set({ compareIds: [] });
      },

      isInCompare: (id: string) => {
        return get().compareIds.includes(id);
      },
    }),
    {
      name: "compare-storage",
    }
  )
);
