/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ReceiptScreen } from "@/components/splity/screens/ReceiptScreen";
import { useBillStore } from "@/stores/bill-store";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/api", () => ({
  scanReceipt: jest.fn(),
}));

import { scanReceipt } from "@/lib/api";
const mockScanReceipt = scanReceipt as jest.MockedFunction<typeof scanReceipt>;

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
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();

  act(() => {
    useBillStore.getState().reset();
  });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderInManualMode() {
  act(() => { useBillStore.getState().setInputMode("manual"); });
  render(<ReceiptScreen />);
}

function renderInScanMode() {
  act(() => { useBillStore.getState().setInputMode("scan"); });
  render(<ReceiptScreen />);
}

function makeFile(name = "receipt.jpg") {
  return new File(["img"], name, { type: "image/jpeg" });
}

// ── Upload state (scan mode) ──────────────────────────────────────────────────

describe("scan mode — upload state", () => {
  it("shows the scan upload area", () => {
    renderInScanMode();
    expect(screen.getByText("Tap to scan receipt")).toBeInTheDocument();
  });

  it("shows the file input accepting images and PDFs", () => {
    renderInScanMode();
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.accept).toContain("image/*");
    expect(input.accept).toContain("application/pdf");
  });

  it("shows 'Enter manually' dock CTA", () => {
    renderInScanMode();
    expect(
      screen.getByRole("button", { name: /enter manually/i })
    ).toBeInTheDocument();
  });

  it("clicking 'Enter manually' switches to review state", () => {
    renderInScanMode();
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    // ScreenHead renders title as a div, so query by text
    expect(screen.getByText("Check the receipt")).toBeInTheDocument();
  });

  it("shows loading state while scanning", async () => {
    let resolve!: (v: unknown) => void;
    mockScanReceipt.mockReturnValueOnce(
      new Promise((r) => { resolve = r; })
    );
    renderInScanMode();

    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [makeFile()] } });

    expect(await screen.findByTestId("scan-loading")).toBeInTheDocument();
    // Resolve to avoid unhandled rejection
    resolve({});
  });

  it("transitions to review state after successful OCR", async () => {
    mockScanReceipt.mockResolvedValueOnce({
      lineItems: [{ description: "Ramen", lineTotal: 14.5 }],
      subTotal: 14.5,
      tax: 1.3,
      tip: 2.9,
    });
    renderInScanMode();

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [makeFile()] },
    });

    await waitFor(() =>
      expect(screen.queryByTestId("scan-loading")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Check the receipt")).toBeInTheDocument();
  });

  it("populates store receipt from OCR data", async () => {
    mockScanReceipt.mockResolvedValueOnce({
      lineItems: [{ description: "Ramen", lineTotal: 14.5 }],
      subTotal: 14.5,
      tax: 1.3,
      tip: 2.9,
    });
    renderInScanMode();

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [makeFile()] },
    });

    await waitFor(() => {
      const r = useBillStore.getState().receipt;
      expect(r.subtotal).toBe(14.5);
      expect(r.tax).toBe(1.3);
      expect(r.items).toHaveLength(1);
      expect(r.items[0].name).toBe("Ramen");
    });
  });

  it("shows OCR error message and review UI on scan failure", async () => {
    mockScanReceipt.mockRejectedValueOnce(new Error("network error"));
    renderInScanMode();

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [makeFile()] },
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Couldn't read the receipt/i)
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Check the receipt")).toBeInTheDocument();
  });
});

// ── Review state (manual mode) ────────────────────────────────────────────────

describe("manual mode — review state", () => {
  it("renders the screen title", () => {
    renderInManualMode();
    expect(screen.getByText("Check the receipt")).toBeInTheDocument();
  });

  it("renders the eyebrow 'Step 2 · Review'", () => {
    renderInManualMode();
    expect(screen.getByText(/Step 2 · Review/i)).toBeInTheDocument();
  });

  it("renders the 'Add item' button", () => {
    renderInManualMode();
    expect(
      screen.getByRole("button", { name: /add item/i })
    ).toBeInTheDocument();
  });

  it("renders Subtotal, Tax, Tip, Discount editable inputs", () => {
    renderInManualMode();
    expect(
      screen.getByRole("textbox", { name: /subtotal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /^tax$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /^tip$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /discount/i })
    ).toBeInTheDocument();
  });

  it("Total has no editable input (read-only derived)", () => {
    renderInManualMode();
    expect(
      screen.queryByRole("textbox", { name: /^total$/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders the info note", () => {
    renderInManualMode();
    expect(
      screen.getByText(/Rates are derived from the printed amounts/i)
    ).toBeInTheDocument();
  });

  it("renders the 'Looks right' dock CTA", () => {
    renderInManualMode();
    expect(
      screen.getByRole("button", { name: /looks right/i })
    ).toBeInTheDocument();
  });

  it("'Looks right' advances step to 2", () => {
    act(() => { useBillStore.setState({ step: 1 }); });
    renderInManualMode();
    fireEvent.click(screen.getByRole("button", { name: /looks right/i }));
    expect(useBillStore.getState().step).toBe(2);
  });
});

// ── Items editing ─────────────────────────────────────────────────────────────

describe("items editing", () => {
  it("clicking 'Add item' creates a new item in the store", () => {
    renderInManualMode();
    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    expect(useBillStore.getState().receipt.items).toHaveLength(1);
  });

  it("shows existing items from the store", () => {
    act(() => {
      useBillStore.getState().setReceipt({
        ...useBillStore.getState().receipt,
        items: [{ id: "i1", name: "Pizza", price: 12.0 }],
      });
    });
    renderInManualMode();
    expect(screen.getByText("Pizza")).toBeInTheDocument();
  });

  it("clicking an item row opens name and price inputs", () => {
    act(() => {
      useBillStore.getState().setReceipt({
        ...useBillStore.getState().receipt,
        items: [{ id: "i1", name: "Ramen", price: 14.5 }],
      });
    });
    renderInManualMode();
    // Button accessible name includes the price text — use regex
    fireEvent.click(screen.getByRole("button", { name: /ramen/i }));
    expect(
      screen.getByRole("textbox", { name: /item name/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /item price/i })
    ).toBeInTheDocument();
  });

  it("editing item name updates the store on blur", () => {
    act(() => {
      useBillStore.getState().setReceipt({
        ...useBillStore.getState().receipt,
        items: [{ id: "i1", name: "Ramen", price: 14.5 }],
      });
    });
    renderInManualMode();
    fireEvent.click(screen.getByRole("button", { name: /ramen/i }));
    const nameInput = screen.getByRole("textbox", { name: /item name/i });
    fireEvent.change(nameInput, { target: { value: "Tonkotsu Ramen" } });
    fireEvent.blur(nameInput);
    expect(useBillStore.getState().receipt.items[0].name).toBe(
      "Tonkotsu Ramen"
    );
  });

  it("clicking delete removes the item from the store", () => {
    act(() => {
      useBillStore.getState().setReceipt({
        ...useBillStore.getState().receipt,
        items: [{ id: "i1", name: "Gyoza", price: 7.0 }],
      });
    });
    renderInManualMode();
    fireEvent.click(screen.getByRole("button", { name: /gyoza/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete gyoza/i }));
    expect(useBillStore.getState().receipt.items).toHaveLength(0);
  });
});

// ── Totals editing ────────────────────────────────────────────────────────────

describe("totals editing", () => {
  it("editing Subtotal updates the store on blur", () => {
    renderInManualMode();
    const input = screen.getByRole("textbox", { name: /subtotal/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "49.25" } });
    fireEvent.blur(input);
    expect(useBillStore.getState().receipt.subtotal).toBe(49.25);
  });

  it("editing Tax updates the store on blur", () => {
    renderInManualMode();
    const input = screen.getByRole("textbox", { name: /^tax$/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "4.31" } });
    fireEvent.blur(input);
    expect(useBillStore.getState().receipt.tax).toBe(4.31);
  });

  it("editing Tip updates the store on blur", () => {
    renderInManualMode();
    const input = screen.getByRole("textbox", { name: /^tip$/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "9.75" } });
    fireEvent.blur(input);
    expect(useBillStore.getState().receipt.tip).toBe(9.75);
  });

  it("editing Discount updates the store on blur", () => {
    renderInManualMode();
    const input = screen.getByRole("textbox", { name: /discount/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5.00" } });
    fireEvent.blur(input);
    expect(useBillStore.getState().receipt.discount).toBe(5.0);
  });

  it("total is derived: equals subtotal when tax/tip/discount are 0", () => {
    renderInManualMode();
    const input = screen.getByRole("textbox", { name: /subtotal/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "49.25" } });
    fireEvent.blur(input);
    expect(useBillStore.getState().receipt.total).toBe(49.25);
  });

  it("total is derived: subtotal + tax + tip - discount", () => {
    renderInManualMode();
    const fields = [
      { name: /subtotal/i, value: "49.25" },
      { name: /^tax$/i, value: "4.31" },
      { name: /^tip$/i, value: "9.75" },
      { name: /discount/i, value: "5.00" },
    ];
    for (const { name, value } of fields) {
      const input = screen.getByRole("textbox", { name });
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value } });
      fireEvent.blur(input);
    }
    // 49.25 + 4.31 + 9.75 - 5.00 = 58.31
    expect(useBillStore.getState().receipt.total).toBe(58.31);
  });

  it("rate chips appear when subtotal is non-zero", () => {
    renderInManualMode();
    const subInput = screen.getByRole("textbox", { name: /subtotal/i });
    fireEvent.focus(subInput);
    fireEvent.change(subInput, { target: { value: "49.25" } });
    fireEvent.blur(subInput);

    const taxInput = screen.getByRole("textbox", { name: /^tax$/i });
    fireEvent.focus(taxInput);
    fireEvent.change(taxInput, { target: { value: "4.31" } });
    fireEvent.blur(taxInput);

    // Tax rate chip: 4.31/49.25*100 ≈ 8.8% (also appears in info note)
    expect(screen.getAllByText("8.8%").length).toBeGreaterThan(0);
  });
});

// ── Retake ────────────────────────────────────────────────────────────────────

describe("retake", () => {
  it("shows ImageSlot with Retake button after a successful scan", async () => {
    mockScanReceipt.mockResolvedValueOnce({
      lineItems: [],
      subTotal: 10,
      tax: 0.9,
      merchant: { name: "Test Place" },
    });
    renderInScanMode();

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [makeFile()] },
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /retake/i })).toBeInTheDocument()
    );
  });

  it("clicking Retake resets receipt and returns to upload", async () => {
    mockScanReceipt.mockResolvedValueOnce({ subTotal: 10 });
    renderInScanMode();

    fireEvent.change(screen.getByTestId("file-input"), {
      target: { files: [makeFile()] },
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /retake/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));

    expect(screen.getByText("Tap to scan receipt")).toBeInTheDocument();
    expect(useBillStore.getState().receipt.subtotal).toBe(0);
  });
});
