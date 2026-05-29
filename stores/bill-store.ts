import { create } from "zustand";
import type { Theme, Person, Receipt, Assignments } from "@/types";

interface BillStore {
  step: number;
  theme: Theme;
  name: string;
  receipt: Receipt;
  people: Person[];
  assignments: Assignments;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setName: (name: string) => void;
  setReceipt: (receipt: Receipt) => void;
  setPeople: (people: Person[]) => void;
  setAssignments: (assignments: Assignments) => void;
  reset: () => void;
}

const DEFAULT_RECEIPT: Receipt = {
  subtotal: 0,
  tax: 0,
  tip: 0,
  discount: 0,
  total: 0,
  place: "",
  items: [],
};

const DEFAULT_PEOPLE: Person[] = [
  { id: "you", name: "You", initial: "Y", color: "#ff7a4d", payer: true },
];

const INITIAL_STATE = {
  step: 0,
  theme: "dark" as Theme,
  name: "",
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
  setReceipt: (receipt) => set({ receipt }),
  setPeople: (people) => set({ people }),
  setAssignments: (assignments) => set({ assignments }),

  reset: () => {
    document.documentElement.setAttribute("data-theme", "dark");
    set(INITIAL_STATE);
  },
}));
