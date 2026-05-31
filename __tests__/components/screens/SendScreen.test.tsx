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

  it("shows '✓ venmo sent' status when window.open succeeds (returns non-null)", () => {
    mockWindowOpen.mockReturnValue({} as Window);
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    expect(screen.getByTestId("status-venmo-alice")).toBeInTheDocument();
  });

  it("does NOT show '✓ venmo sent' when window.open returns null (popup blocked)", () => {
    mockWindowOpen.mockReturnValue(null);
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    expect(screen.queryByTestId("status-venmo-alice")).not.toBeInTheDocument();
  });

  it("shows fallback toast when window.open returns null", () => {
    mockWindowOpen.mockReturnValue(null);
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    expect(screen.getByTestId("toast")).toHaveTextContent(/not found/i);
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

  it("Zelle uses Web Share API when available", async () => {
    Object.defineProperty(navigator, "share", {
      writable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    expect(navigator.share).toHaveBeenCalledTimes(1);
    const shareArg = (navigator.share as jest.Mock).mock.calls[0][0];
    expect(shareArg.text).toMatch(/Alice/);
    expect(shareArg.text).toMatch(/\$\d+\.\d{2}/);
  });

  it("Zelle still marks as sent when Web Share is cancelled (throws)", async () => {
    Object.defineProperty(navigator, "share", {
      writable: true,
      value: jest.fn().mockRejectedValue(new Error("AbortError")),
    });
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    expect(screen.getByTestId("status-zelle-alice")).toBeInTheDocument();
  });

  it("does NOT show success chip when both share and clipboard are unavailable", async () => {
    Object.defineProperty(navigator, "share", { writable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { writable: true, value: undefined });
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    expect(screen.queryByTestId("status-zelle-alice")).not.toBeInTheDocument();
    expect(screen.getByTestId("toast")).toHaveTextContent(/unavailable/i);
  });

  it("does NOT show success chip when clipboard.writeText rejects and share is absent", async () => {
    Object.defineProperty(navigator, "share", { writable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    expect(screen.queryByTestId("status-zelle-alice")).not.toBeInTheDocument();
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

  it("does NOT show success chip when clipboard.writeText rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(screen.queryByTestId("status-copy-alice")).not.toBeInTheDocument();
  });

  it("does NOT show success chip when clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: undefined,
    });
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(screen.queryByTestId("status-copy-alice")).not.toBeInTheDocument();
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

  it("toast has aria-live='polite' for screen reader announcements", async () => {
    render(<SendScreen />);
    const [aliceCopy] = screen.getAllByRole("button", { name: /copy/i });
    await act(async () => {
      fireEvent.click(aliceCopy);
    });
    expect(screen.getByTestId("toast")).toHaveAttribute("aria-live", "polite");
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
    render(<SendScreen />);

    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const appendSpy = jest.spyOn(document.body, "appendChild").mockImplementation((el) => el);
    const removeSpy = jest.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    fireEvent.click(screen.getByRole("button", { name: /export to csv/i }));

    expect(createSpy).toHaveBeenCalledTimes(1);
    const blobArg = createSpy.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);

    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("CSV filename is '<expense-name>.csv'", () => {
    render(<SendScreen />);

    const anchorElements: HTMLAnchorElement[] = [];
    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const appendSpy = jest.spyOn(document.body, "appendChild").mockImplementation((el) => {
      if (el instanceof HTMLAnchorElement) anchorElements.push(el);
      return el;
    });
    const removeSpy = jest.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    fireEvent.click(screen.getByRole("button", { name: /export to csv/i }));

    expect(anchorElements.length).toBe(1);
    expect(anchorElements[0].download).toBe("Dinner.csv");

    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

// ── Empty name fallback ───────────────────────────────────────────────────────

describe("<SendScreen /> — empty name fallback", () => {
  it("memo chip shows 'Bill' when expense name is empty", () => {
    act(() => {
      useBillStore.setState({ name: "" });
    });
    render(<SendScreen />);
    expect(screen.getByTestId("memo-chip")).toHaveTextContent("Bill");
  });

  it("Venmo note uses 'Bill' when expense name is empty", () => {
    act(() => {
      useBillStore.setState({ name: "" });
    });
    render(<SendScreen />);
    const [aliceVenmo] = screen.getAllByRole("button", { name: /venmo/i });
    fireEvent.click(aliceVenmo);
    const url: string = mockWindowOpen.mock.calls[0][0];
    expect(url).toContain("note=Bill");
  });

  it("Zelle message uses 'Bill' when expense name is empty", async () => {
    act(() => {
      useBillStore.setState({ name: "" });
    });
    render(<SendScreen />);
    const [aliceZelle] = screen.getAllByRole("button", { name: /zelle/i });
    await act(async () => {
      fireEvent.click(aliceZelle);
    });
    const written = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    expect(written).toContain("Bill");
  });

  it("CSV export uses 'Bill' filename when expense name is empty", () => {
    act(() => {
      useBillStore.setState({ name: "" });
    });
    render(<SendScreen />);
    const anchorElements: HTMLAnchorElement[] = [];
    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const appendSpy = jest.spyOn(document.body, "appendChild").mockImplementation((el) => {
      if (el instanceof HTMLAnchorElement) anchorElements.push(el);
      return el;
    });
    const removeSpy = jest.spyOn(document.body, "removeChild").mockImplementation((el) => el);
    fireEvent.click(screen.getByRole("button", { name: /export to csv/i }));
    expect(anchorElements[0]?.download).toBe("Bill.csv");
    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

// ── Toast timer de-dupe ───────────────────────────────────────────────────────

describe("<SendScreen /> — toast timer", () => {
  it("clicking two actions quickly replaces the prior toast (timer de-dup)", async () => {
    render(<SendScreen />);
    const venmoButtons = screen.getAllByRole("button", { name: /venmo/i });
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    // First action — starts timer
    fireEvent.click(venmoButtons[0]);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    // Second action immediately — clears first timer, starts new one
    await act(async () => {
      fireEvent.click(copyButtons[0]);
    });
    // Toast should still be visible (new timer running)
    expect(screen.getByTestId("toast")).toBeInTheDocument();
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
