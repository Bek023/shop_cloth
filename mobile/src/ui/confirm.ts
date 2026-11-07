import { create } from 'zustand';

type Pending = { title: string; message: string; okLabel: string; onOk: () => void };

/**
 * In-app confirmation dialog state. Rendered by <ConfirmHost /> in the root layout.
 * Used instead of Alert.alert / window.confirm so it looks the same on iOS, Android
 * and web, and works where browser dialogs are blocked.
 */
export const useConfirm = create<{ pending: Pending | null; close: () => void }>()((set) => ({
  pending: null,
  close: () => set({ pending: null }),
}));

export function confirm(title: string, message: string, okLabel: string, onOk: () => void) {
  useConfirm.setState({ pending: { title, message, okLabel, onOk } });
}
