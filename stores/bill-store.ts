import { create } from "zustand";
import type { Theme, InputMode, StorePerson, StoreReceipt, Assignments } from "@/types";

interface BillStore {
  step: number;
  theme: Theme;
  name: string;
  inputMode: InputMode | null;
  receipt: StoreReceipt;
  people: StorePerson[];
  assignments: Assignments;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setName: (name: string) => void;
  setInputMode: (mode: InputMode) => void;
  setReceipt: (receipt: StoreReceipt) => void;
  setPeople: (people: StorePerson[]) => void;
  setAssignments: (assignments: Assignments) => void;
  reset: () => void;
}

const DEFAULT_RECEIPT: StoreReceipt = {
  subtotal: 0,
  tax: 0,
  tip: 0,
  discount: 0,
  total: 0,
  place: "",
  items: [],
};

const DEFAULT_PEOPLE: StorePerson[] = [
  { id: "you", name: "You", initial: "Y", color: "#ff7a4d", payer: true },
];

const INITIAL_STATE = {
  step: 0,
  theme: "dark" as Theme,
  name: "",
  inputMode: null as InputMode | null,
  receipt: DEFAULT_RECEIPT,
  people: DEFAULT_PEOPLE,
  assignments: {},
};

export const useBillStore = create<BillStore>((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 5) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),

  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return { theme: next };
    }),

  setName: (name) => set({ name }),
  setInputMode: (inputMode) => set({ inputMode }),
  setReceipt: (receipt) => set({ receipt }),
  setPeople: (people) => set({ people }),
  setAssignments: (assignments) => set({ assignments }),

  reset: () => {
    document.documentElement.setAttribute("data-theme", "dark");
    set(INITIAL_STATE);
  },
}));
