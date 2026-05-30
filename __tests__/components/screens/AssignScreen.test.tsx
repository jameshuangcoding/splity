/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, within } from "@testing-library/react";
import { act } from "react";
import { AssignScreen } from "@/components/splity/screens/AssignScreen";
import { useBillStore } from "@/stores/bill-store";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RECEIPT = {
  subtotal: 40.0,
  tax: 3.6,
  tip: 6.0,
  discount: 0,
  total: 49.6,
  place: "Test Restaurant",
  items: [
    { id: "item-1", name: "Burger", price: 15.0 },
    { id: "item-2", name: "Pizza", price: 25.0 },
  ],
};

const PEOPLE = [
  { id: "you", name: "You", initial: "Y", color: "#ff7a4d", payer: true },
  { id: "alice", name: "Alice", initial: "A", color: "#3ddc97", payer: false },
];

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(performance.now() + 1000);
    return 0;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

  act(() => {
    useBillStore.getState().reset();
    useBillStore.getState().setReceipt(RECEIPT);
    useBillStore.getState().setPeople(PEOPLE);
    useBillStore.getState().setAssignments({});
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Header ────────────────────────────────────────────────────────────────────

describe("<AssignScreen /> — header", () => {
  it("renders 'Who had what?' title", () => {
    render(<AssignScreen />);
    expect(screen.getByText("Who had what?")).toBeInTheDocument();
  });

  it("renders Step 3 eyebrow", () => {
    render(<AssignScreen />);
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
  });

  it("shows 0/2 assigned chip when nothing is assigned", () => {
    render(<AssignScreen />);
    expect(screen.getByText("0/2 assigned")).toBeInTheDocument();
  });

  it("chip updates to 1/2 after assigning one item", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you"] });
    });
    expect(screen.getByText("1/2 assigned")).toBeInTheDocument();
  });

  it("chip updates to 2/2 when all items assigned", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore
        .getState()
        .setAssignments({ "item-1": ["you"], "item-2": ["alice"] });
    });
    expect(screen.getByText("2/2 assigned")).toBeInTheDocument();
  });
});

// ── Live rail ─────────────────────────────────────────────────────────────────

describe("<AssignScreen /> — live rail", () => {
  it("renders each person's name in the rail", () => {
    render(<AssignScreen />);
    expect(screen.getByTestId("rail-name-you")).toBeInTheDocument();
    expect(screen.getByTestId("rail-name-alice")).toBeInTheDocument();
  });

  it("live rail totals update after assigning all items to one person", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore.getState().setAssignments({
        "item-1": ["you"],
        "item-2": ["you"],
      });
    });
    // receipt.total = 49.60; payer absorbs rounding, so You's total = 49.60
    const youTotal = screen.getByTestId("rail-total-you");
    expect(youTotal.textContent).toBe("$49.60");
  });

  it("live rail shows $0.00 for unassigned person", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you"], "item-2": ["you"] });
    });
    const aliceTotal = screen.getByTestId("rail-total-alice");
    expect(aliceTotal.textContent).toBe("$0.00");
  });
});

// ── Items card ────────────────────────────────────────────────────────────────

describe("<AssignScreen /> — items card", () => {
  it("renders each item name", () => {
    render(<AssignScreen />);
    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Pizza")).toBeInTheDocument();
  });

  it("renders each item price", () => {
    render(<AssignScreen />);
    expect(screen.getByText("$15.00")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });

  it("unassigned items show 'tap to assign' chip", () => {
    render(<AssignScreen />);
    const chips = screen.getAllByText("tap to assign");
    expect(chips).toHaveLength(2);
  });

  it("assigned item shows no 'tap to assign' chip", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you"] });
    });
    expect(screen.getAllByText("tap to assign")).toHaveLength(1);
  });

  it("item split 2 ways shows ÷2 ea label", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you", "alice"] });
    });
    expect(screen.getByText(/÷2 ea/i)).toBeInTheDocument();
  });
});

// ── AssignSheet ───────────────────────────────────────────────────────────────

describe("<AssignScreen /> — AssignSheet", () => {
  it("tapping an item row opens the AssignSheet", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("AssignSheet shows the item name", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    expect(within(screen.getByRole("dialog")).getByText("Burger")).toBeInTheDocument();
  });

  it("AssignSheet shows the item price", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    expect(within(screen.getByRole("dialog")).getByText("$15.00")).toBeInTheDocument();
  });

  it("AssignSheet renders a toggle button for each person", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    expect(screen.getByRole("button", { name: /toggle you/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /toggle alice/i })).toBeInTheDocument();
  });

  it("AssignSheet pre-selects current assignees", () => {
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you"] });
    });
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    const youToggle = screen.getByRole("button", { name: /toggle you/i });
    expect(youToggle).toHaveAttribute("aria-pressed", "true");
    const aliceToggle = screen.getByRole("button", { name: /toggle alice/i });
    expect(aliceToggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggling a person changes their aria-pressed state", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    const youToggle = screen.getByRole("button", { name: /toggle you/i });
    expect(youToggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(youToggle);
    expect(youToggle).toHaveAttribute("aria-pressed", "true");
  });

  it("'Everyone' button selects all people", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    fireEvent.click(screen.getByRole("button", { name: /everyone/i }));
    expect(
      screen.getByRole("button", { name: /toggle you/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /toggle alice/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("'Done' updates assignments in the Zustand store", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    fireEvent.click(screen.getByRole("button", { name: /toggle you/i }));
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(useBillStore.getState().assignments["item-1"]).toEqual(["you"]);
  });

  it("'Done' closes the sheet", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking the scrim closes the sheet", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    fireEvent.click(screen.getByTestId("assign-scrim"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows ÷N split note when multiple people selected in sheet", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    fireEvent.click(screen.getByRole("button", { name: /everyone/i }));
    // ÷2 · $7.50 ea
    expect(within(screen.getByRole("dialog")).getByText(/÷2/i)).toBeInTheDocument();
  });

  it("live rail total for You updates after assigning Burger via Done", () => {
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /assign burger/i }));
    fireEvent.click(screen.getByRole("button", { name: /toggle you/i }));
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    // With only Burger ($15) assigned to You: sub=15, total = 15*(1 + 3.6/40 + 6/40) = 15*1.24 = 18.6
    // payer absorbs rounding, but Pizza unassigned so payer total = 18.60
    const youTotal = screen.getByTestId("rail-total-you");
    expect(youTotal.textContent).not.toBe("$0.00");
  });
});

// ── Split remaining ───────────────────────────────────────────────────────────

describe("<AssignScreen /> — split remaining", () => {
  it("shows 'Split the remaining 2 evenly' when nothing assigned", () => {
    render(<AssignScreen />);
    expect(
      screen.getByRole("button", { name: /split the remaining 2 evenly/i })
    ).toBeInTheDocument();
  });

  it("shows 'Split the remaining 1 evenly' when 1 of 2 items unassigned", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you"] });
    });
    expect(
      screen.getByRole("button", { name: /split the remaining 1 evenly/i })
    ).toBeInTheDocument();
  });

  it("button disappears when all items are assigned", () => {
    render(<AssignScreen />);
    act(() => {
      useBillStore
        .getState()
        .setAssignments({ "item-1": ["you"], "item-2": ["alice"] });
    });
    expect(
      screen.queryByRole("button", { name: /split the remaining/i })
    ).not.toBeInTheDocument();
  });

  it("clicking 'Split remaining' assigns all unassigned items to everyone", () => {
    render(<AssignScreen />);
    fireEvent.click(
      screen.getByRole("button", { name: /split the remaining 2 evenly/i })
    );
    const assignments = useBillStore.getState().assignments;
    expect(assignments["item-1"]).toEqual(["you", "alice"]);
    expect(assignments["item-2"]).toEqual(["you", "alice"]);
  });

  it("clicking 'Split remaining' only assigns unassigned items", () => {
    act(() => {
      useBillStore.getState().setAssignments({ "item-1": ["you"] });
    });
    render(<AssignScreen />);
    fireEvent.click(
      screen.getByRole("button", { name: /split the remaining 1 evenly/i })
    );
    const assignments = useBillStore.getState().assignments;
    expect(assignments["item-1"]).toEqual(["you"]); // unchanged
    expect(assignments["item-2"]).toEqual(["you", "alice"]); // newly assigned
  });
});

// ── Dock CTA ─────────────────────────────────────────────────────────────────

describe("<AssignScreen /> — dock CTA", () => {
  it("renders 'See the breakdown →' CTA", () => {
    render(<AssignScreen />);
    expect(
      screen.getByRole("button", { name: /see the breakdown/i })
    ).toBeInTheDocument();
  });

  it("dock CTA advances step to 4", () => {
    act(() => {
      useBillStore.getState().setStep(3);
    });
    render(<AssignScreen />);
    fireEvent.click(screen.getByRole("button", { name: /see the breakdown/i }));
    expect(useBillStore.getState().step).toBe(4);
  });
});
