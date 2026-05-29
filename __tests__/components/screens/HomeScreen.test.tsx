/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { HomeScreen } from "@/components/splity/screens/HomeScreen";
import { useBillStore } from "@/stores/bill-store";

// Money component needs matchMedia + rAF in jsdom
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
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("<HomeScreen />", () => {
  it("renders the Splity wordmark", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Splity")).toBeInTheDocument();
  });

  it("renders the 'no account needed' chip", () => {
    render(<HomeScreen />);
    expect(screen.getByText("no account needed")).toBeInTheDocument();
  });

  it("renders the hero headline", () => {
    render(<HomeScreen />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Split a bill/)).toBeInTheDocument();
    expect(screen.getByText(/down to the cent/)).toBeInTheDocument();
  });

  it("renders the hero subtitle", () => {
    render(<HomeScreen />);
    expect(
      screen.getByText(/Scan the receipt and Splity allocates/)
    ).toBeInTheDocument();
  });

  it("renders the 'This bill' eyebrow", () => {
    render(<HomeScreen />);
    expect(screen.getByText(/this bill/i)).toBeInTheDocument();
  });

  it("renders the expense name input with correct aria-label", () => {
    render(<HomeScreen />);
    expect(
      screen.getByRole("textbox", { name: /expense name/i })
    ).toBeInTheDocument();
  });

  it("expense name input starts empty", () => {
    render(<HomeScreen />);
    const input = screen.getByRole("textbox", {
      name: /expense name/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("typing in expense name updates the store", () => {
    render(<HomeScreen />);
    const input = screen.getByRole("textbox", { name: /expense name/i });
    fireEvent.change(input, { target: { value: "Dinner at Joe's" } });
    expect(useBillStore.getState().name).toBe("Dinner at Joe's");
  });

  it("reflects a pre-existing store name", () => {
    act(() => {
      useBillStore.getState().setName("Team Lunch");
    });
    render(<HomeScreen />);
    const input = screen.getByRole("textbox", {
      name: /expense name/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("Team Lunch");
  });

  it("renders Items stat", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Items")).toBeInTheDocument();
  });

  it("renders People stat", () => {
    render(<HomeScreen />);
    expect(screen.getByText("People")).toBeInTheDocument();
  });

  it("renders Total stat", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("Items stat shows receipt item count", () => {
    act(() => {
      useBillStore.getState().setReceipt({
        ...useBillStore.getState().receipt,
        items: [
          { id: "1", name: "Pizza", price: 12 },
          { id: "2", name: "Salad", price: 8 },
        ],
      });
    });
    render(<HomeScreen />);
    // Items count "2" appears adjacent to the Items label
    const labels = screen.getAllByText("2");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("People stat shows store people count (default: 1)", () => {
    render(<HomeScreen />);
    // "1" from the default 'You' person
    const ones = screen.getAllByText("1");
    expect(ones.length).toBeGreaterThan(0);
  });

  it("renders the info hint", () => {
    render(<HomeScreen />);
    expect(
      screen.getByText(/Under 2 minutes from scan to settled/)
    ).toBeInTheDocument();
  });

  it("renders the primary 'Scan a receipt' CTA", () => {
    render(<HomeScreen />);
    expect(
      screen.getByRole("button", { name: /scan a receipt/i })
    ).toBeInTheDocument();
  });

  it("renders the ghost 'Enter manually' CTA", () => {
    render(<HomeScreen />);
    expect(
      screen.getByRole("button", { name: /enter manually/i })
    ).toBeInTheDocument();
  });

  it("'Scan a receipt' advances step to 1", () => {
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: /scan a receipt/i }));
    expect(useBillStore.getState().step).toBe(1);
  });

  it("'Enter manually' advances step to 1", () => {
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: /enter manually/i }));
    expect(useBillStore.getState().step).toBe(1);
  });
});
