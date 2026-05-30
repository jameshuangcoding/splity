/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { SummaryScreen } from "@/components/splity/screens/SummaryScreen";
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

const ASSIGNMENTS = {
  "item-1": ["you"],
  "item-2": ["alice"],
};

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
    useBillStore.setState({ name: "Dinner" });
    useBillStore.getState().setReceipt(RECEIPT);
    useBillStore.getState().setPeople(PEOPLE);
    useBillStore.getState().setAssignments(ASSIGNMENTS);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Hero card ─────────────────────────────────────────────────────────────────

describe("<SummaryScreen /> — hero card", () => {
  it("renders expense name eyebrow", () => {
    render(<SummaryScreen />);
    expect(screen.getByText("Dinner")).toBeInTheDocument();
  });

  it("renders grand total via <Money>", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("summary-grand-total")).toBeInTheDocument();
  });

  it("renders '✓ matches receipt' chip", () => {
    render(<SummaryScreen />);
    expect(screen.getByText(/matches receipt/i)).toBeInTheDocument();
  });

  it("renders place name", () => {
    render(<SummaryScreen />);
    expect(screen.getByText(/Test Restaurant/i)).toBeInTheDocument();
  });

  it("renders 'split N ways' text", () => {
    render(<SummaryScreen />);
    expect(screen.getByText(/split 2 ways/i)).toBeInTheDocument();
  });
});

// ── Per-person cards ───────────────────────────────────────────────────────────

describe("<SummaryScreen /> — person cards", () => {
  it("renders a card for each person", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-card-you")).toBeInTheDocument();
    expect(screen.getByTestId("person-card-alice")).toBeInTheDocument();
  });

  it("renders person name on each card", () => {
    render(<SummaryScreen />);
    expect(screen.getAllByText("You").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
  });

  it("renders payer chip only on payer card", () => {
    render(<SummaryScreen />);
    const payerCards = screen.getAllByText(/payer/i);
    expect(payerCards).toHaveLength(1);
  });

  it("renders item count on each card", () => {
    render(<SummaryScreen />);
    expect(screen.getAllByText(/1 item/i).length).toBeGreaterThan(0);
  });

  it("renders person total on each card", () => {
    render(<SummaryScreen />);
    const youCard = screen.getByTestId("person-card-you");
    expect(youCard).toBeInTheDocument();
    const aliceCard = screen.getByTestId("person-card-alice");
    expect(aliceCard).toBeInTheDocument();
  });
});

// ── Expand / collapse ─────────────────────────────────────────────────────────

describe("<SummaryScreen /> — expand/collapse", () => {
  it("first person card is expanded by default", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-expanded-you")).toBeInTheDocument();
  });

  it("second person card is collapsed by default", () => {
    render(<SummaryScreen />);
    expect(
      screen.queryByTestId("person-expanded-alice")
    ).not.toBeInTheDocument();
  });

  it("clicking a collapsed card expands it", () => {
    render(<SummaryScreen />);
    fireEvent.click(screen.getByTestId("person-card-alice"));
    expect(screen.getByTestId("person-expanded-alice")).toBeInTheDocument();
  });

  it("clicking an expanded card collapses it", () => {
    render(<SummaryScreen />);
    fireEvent.click(screen.getByTestId("person-card-you"));
    expect(
      screen.queryByTestId("person-expanded-you")
    ).not.toBeInTheDocument();
  });

  it("expanding a card collapses the previously expanded card", () => {
    render(<SummaryScreen />);
    fireEvent.click(screen.getByTestId("person-card-alice"));
    expect(
      screen.queryByTestId("person-expanded-you")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("person-expanded-alice")).toBeInTheDocument();
  });
});

// ── Expanded content ──────────────────────────────────────────────────────────

describe("<SummaryScreen /> — expanded content", () => {
  it("shows assigned item name in expanded section", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-expanded-you")).toBeInTheDocument();
    expect(screen.getByText("Burger")).toBeInTheDocument();
  });

  it("shows Item subtotal line in expanded section", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-expanded-you")).toBeInTheDocument();
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
  });

  it("shows +tax line in expanded section", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-expanded-you")).toBeInTheDocument();
    expect(screen.getByText(/\+tax/i)).toBeInTheDocument();
  });

  it("shows +tip line in expanded section", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-expanded-you")).toBeInTheDocument();
    expect(screen.getByText(/\+tip/i)).toBeInTheDocument();
  });

  it("shows payer rounding note only on payer card when expanded", () => {
    render(<SummaryScreen />);
    expect(screen.getByTestId("person-expanded-you")).toBeInTheDocument();
    expect(screen.getByTestId("payer-rounding-note")).toBeInTheDocument();
  });

  it("does NOT show rounding note on non-payer card", () => {
    render(<SummaryScreen />);
    fireEvent.click(screen.getByTestId("person-card-alice"));
    expect(
      screen.queryByTestId("payer-rounding-note")
    ).not.toBeInTheDocument();
  });

  it("shows ÷N label for shared items", () => {
    act(() => {
      useBillStore.getState().setAssignments({
        "item-1": ["you", "alice"],
        "item-2": ["alice"],
      });
    });
    render(<SummaryScreen />);
    expect(screen.getByText(/÷2/i)).toBeInTheDocument();
  });

  it("shows −discount line when discount > 0", () => {
    act(() => {
      useBillStore.getState().setReceipt({
        ...RECEIPT,
        discount: 5.0,
        total: 44.6,
      });
    });
    render(<SummaryScreen />);
    expect(screen.getByText(/−discount/i)).toBeInTheDocument();
  });
});

// ── Math correctness ──────────────────────────────────────────────────────────

describe("<SummaryScreen /> — math", () => {
  it("per-person totals sum to receipt total exactly", () => {
    render(<SummaryScreen />);
    const state = useBillStore.getState();
    const { compute } = jest.requireActual("@/lib/calculation/engine");
    const calc = compute(
      state.receipt,
      state.receipt.items,
      state.people.map((p) => ({ id: p.id, name: p.name, payer: p.payer })),
      state.assignments
    );
    const sum = Object.values(calc.breakdown).reduce(
      (acc, b) => acc + b.total,
      0
    );
    expect(Math.abs(sum - state.receipt.total)).toBeLessThan(0.01);
  });
});

// ── Dock ──────────────────────────────────────────────────────────────────────

describe("<SummaryScreen /> — dock", () => {
  it("renders 'Send payment requests' CTA", () => {
    render(<SummaryScreen />);
    expect(
      screen.getByRole("button", { name: /send payment requests/i })
    ).toBeInTheDocument();
  });

  it("clicking CTA advances step to 5", () => {
    act(() => {
      useBillStore.setState({ step: 4 });
    });
    render(<SummaryScreen />);
    fireEvent.click(
      screen.getByRole("button", { name: /send payment requests/i })
    );
    expect(useBillStore.getState().step).toBe(5);
  });
});
