import { create } from 'zustand';

interface UiStore {
  selectedEventId: string | null;
  openEventSidebar: (id: string) => void;
  closeEventSidebar: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedEventId: null,
  openEventSidebar: (id) => set({ selectedEventId: id }),
  closeEventSidebar: () => set({ selectedEventId: null }),
}));
