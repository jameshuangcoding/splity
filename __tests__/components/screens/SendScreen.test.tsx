/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { SendScreen } from "@/components/splity/screens/SendScreen";
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
  { id: "bob", name: "Bob", initial: "B", color: "#5b8cff", payer: false },
];

const ASSIGNMENTS = {
  "item-1": ["you"],
  "item-2": ["alice"],
};

// ── Setup ─────────────────────────────────────────────────────────────────────

let mockWindowOpen: jest.Mock;

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

  mockWindowOpen = jest.fn();
  Object.defineProperty(window, "open", { writable: true, value: mockWindowOpen });

  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
  });

  Object.defineProperty(navigator, "share", {
    writable: true,
    value: undefined,
  });

  Object.defineProperty(global, "URL", {
    writable: true,
    value: {
      createObjectURL: jest.fn().mockReturnValue("blob:fake"),
      revokeObjectURL: jest.fn(),
    },
  });

  act(() => {
    useBillStore.getState().reset();
    useBillStore.setState({ name: "Dinner", step: 5 });
    useBillStore.getState().setReceipt(RECEIPT);
    useBillStore.getState().setPeople(PEOPLE);
    useBillStore.getState().setAssignments(ASSIGNMENTS);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Header ────────────────────────────────────────────────────────────────────

describe("<SendScreen /> — header", () => {
  it("renders 'Collect what you're owed' title", () => {
    render(<SendScreen />);
    expect(
      screen.getByText(/collect what you're owed/i)
    ).toBeInTheDocument();
  });

  it("renders memo chip with expense name", () => {
    render(<SendScreen />);
    expect(screen.getByTestId("memo-chip")).toBeInTheDocument();
    expect(screen.getByTestId("memo-chip")).toHaveTextContent("Dinner");
  });
});

// ── Non-payer cards ───────────────────────────────────────────────────────────

describe("<SendScreen /> — non-payer cards", () => {
  it("renders a card for each non-payer", () => {
    render(<SendScreen />);
    expect(screen.getByTestId("send-card-alice")).toBeInTheDocument();
    expect(screen.getByTestId("send-card-bob")).toBeInTheDocument();
  });

  it("does NOT render a card for the payer", () => {
    render(<SendScreen />);
    expect(screen.queryByTestId("send-card-you")).not.toBeInTheDocument();
  });

  it("renders non-payer name on each card", () => {
    render(<SendScreen />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders the person's owed amount on each card", () => {
    render(<SendScreen />);
    const aliceCard = screen.getByTestId("send-card-alice");
    expect(aliceCard).toBeInTheDocument();
  });
});

// ── Venmo button ──────────────────────────────────────────────────────────────

describe("<SendScreen /> — Venmo deep link", () => {
  it("renders Venmo button for each non-payer", () => {
    render(<SendScreen />);
    const venmoButtons = screen.getAllByRole("button", { name: /venmo/i });
    expect(venmoButtons.length).toBe(2);
  });

  it("Venmo button opens correct deep link format", () => {
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    const url: string = mockWindowOpen.mock.calls[0][0];
    expect(url).toMatch(/^venmo:\/\/paycharge/);
    expect(url).toContain("txn=pay");
    expect(url).toContain("amount=");
    // note should be the expense name
    expect(url).toContain("note=Dinner");
  });

  it("Venmo deep link amount is formatted to 2 decimal places", () => {
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    const url: string = mockWindowOpen.mock.calls[0][0];
    expect(url).toMatch(/amount=\d+\.\d{2}/);
  });

  it("shows '✓ venmo sent' status after clicking Venmo", () => {
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    expect(screen.getByTestId("status-venmo-alice")).toBeInTheDocument();
  });
});

// ── Zelle button ──────────────────────────────────────────────────────────────

describe("<SendScreen /> — Zelle", () => {
  it("renders Zelle button for each non-payer", () => {
    render(<SendScreen />);
    const zelleButtons = screen.getAllByRole("button", { name: /zelle/i });
    expect(zelleButtons.length).toBe(2);
  });

  it("Zelle falls back to clipboard when Web Share API is not available", async () => {
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const written = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    expect(written).toMatch(/alice/i);
    expect(written).toMatch(/\$\d+\.\d{2}/i);
  });

  it("shows '✓ zelle sent' status after clicking Zelle", async () => {
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    expect(screen.getByTestId("status-zelle-alice")).toBeInTheDocument();
  });
});

// ── Copy button ───────────────────────────────────────────────────────────────

describe("<SendScreen /> — Copy", () => {
  it("renders Copy button for each non-payer", () => {
    render(<SendScreen />);
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons.length).toBe(2);
  });

  it("Copy writes '<name> — $X.XX' to clipboard", async () => {
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const written = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    expect(written).toMatch(/^Alice — \$\d+\.\d{2}$/);
  });

  it("shows '✓ copied' status after clicking Copy", async () => {
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(screen.getByTestId("status-copy-alice")).toBeInTheDocument();
  });
});

// ── Toast ─────────────────────────────────────────────────────────────────────

describe("<SendScreen /> — toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("toast appears after an action", async () => {
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(screen.getByTestId("toast")).toBeInTheDocument();
  });

  it("toast auto-dismisses after 1.9s", async () => {
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1900);
    });
    await waitFor(() => {
      expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
    });
  });
});

// ── Dock: CSV export ──────────────────────────────────────────────────────────

describe("<SendScreen /> — CSV export", () => {
  it("renders 'Export to CSV' ghost button", () => {
    render(<SendScreen />);
    expect(
      screen.getByRole("button", { name: /export to csv/i })
    ).toBeInTheDocument();
  });

  it("CSV export triggers a Blob download", () => {
    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const appendSpy = jest.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    const removeSpy = jest.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    render(<SendScreen />);
    fireEvent.click(screen.getByRole("button", { name: /export to csv/i }));

    expect(createSpy).toHaveBeenCalledTimes(1);
    const blobArg = createSpy.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("CSV filename is '<expense-name>.csv'", () => {
    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const appendSpy = jest.spyOn(document.body, "appendChild").mockImplementation((el) => {
      // Capture the anchor element to verify download attribute
      if (el instanceof HTMLAnchorElement) {
        expect(el.download).toBe("Dinner.csv");
      }
      return el;
    });
    const removeSpy = jest.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    render(<SendScreen />);
    fireEvent.click(screen.getByRole("button", { name: /export to csv/i }));

    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

// ── Dock: Done / new bill ─────────────────────────────────────────────────────

describe("<SendScreen /> — Done · new bill", () => {
  it("renders 'Done · new bill' primary CTA", () => {
    render(<SendScreen />);
    expect(
      screen.getByRole("button", { name: /done.*new bill/i })
    ).toBeInTheDocument();
  });

  it("clicking 'Done · new bill' resets the store to step 0", () => {
    render(<SendScreen />);
    fireEvent.click(screen.getByRole("button", { name: /done.*new bill/i }));
    expect(useBillStore.getState().step).toBe(0);
  });

  it("clicking 'Done · new bill' clears receipt and people", () => {
    render(<SendScreen />);
    fireEvent.click(screen.getByRole("button", { name: /done.*new bill/i }));
    expect(useBillStore.getState().name).toBe("");
    expect(useBillStore.getState().assignments).toEqual({});
  });
});
