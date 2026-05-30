/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { PeopleScreen } from "@/components/splity/screens/PeopleScreen";
import { useBillStore } from "@/stores/bill-store";

const PALETTE = ["#ff7a4d", "#3ddc97", "#5b8cff", "#c084fc"];

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

describe("<PeopleScreen />", () => {
  // ── "You" row ───────────────────────────────────────────────────────────────

  it("renders the 'You' person row", () => {
    render(<PeopleScreen />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("'You' row shows a payer chip", () => {
    render(<PeopleScreen />);
    expect(screen.getByText(/payer/i)).toBeInTheDocument();
  });

  it("'You' row has no remove button", () => {
    render(<PeopleScreen />);
    expect(
      screen.queryByRole("button", { name: /remove you/i })
    ).not.toBeInTheDocument();
  });

  // ── Add-name input ──────────────────────────────────────────────────────────

  it("renders the add-name input", () => {
    render(<PeopleScreen />);
    expect(
      screen.getByRole("textbox", { name: /add a name/i })
    ).toBeInTheDocument();
  });

  it("renders the add-person button", () => {
    render(<PeopleScreen />);
    expect(
      screen.getByRole("button", { name: /add person/i })
    ).toBeInTheDocument();
  });

  it("adding a name via button adds person to the store", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(useBillStore.getState().people.map((p) => p.name)).toContain(
      "Alice"
    );
  });

  it("adding a name via Enter key adds person to the store", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Bob" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(useBillStore.getState().people.map((p) => p.name)).toContain("Bob");
  });

  it("input clears after adding a person", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", {
      name: /add a name/i,
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Carol" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(input.value).toBe("");
  });

  it("empty name does not add a person", () => {
    render(<PeopleScreen />);
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(useBillStore.getState().people).toHaveLength(1);
  });

  it("whitespace-only name does not add a person", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(useBillStore.getState().people).toHaveLength(1);
  });

  // ── Derived fields (initial + color) ────────────────────────────────────────

  it("new person's initial is the uppercased first letter", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "diana" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    const added = useBillStore
      .getState()
      .people.find((p) => p.name === "diana");
    expect(added?.initial).toBe("D");
  });

  it("first new person gets palette color index 1 (#3ddc97)", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Eve" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    const added = useBillStore.getState().people.find((p) => p.name === "Eve");
    expect(added?.color).toBe(PALETTE[1]);
  });

  it("color cycles through the palette for subsequent people", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });

    for (const name of ["P1", "P2", "P3", "P4"]) {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    }

    const added = useBillStore
      .getState()
      .people.filter((p) => !p.payer)
      .map((p) => p.color);
    expect(added[0]).toBe(PALETTE[1]); // 2nd person
    expect(added[1]).toBe(PALETTE[2]); // 3rd person
    expect(added[2]).toBe(PALETTE[3]); // 4th person
    expect(added[3]).toBe(PALETTE[0]); // wraps to 0
  });

  it("color stays unique after removing a person then adding a new one", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });

    // Add two people — they get PALETTE[1] and PALETTE[2]
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    fireEvent.change(input, { target: { value: "B" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));

    // Remove A (PALETTE[1] is now free)
    fireEvent.click(screen.getByRole("button", { name: /remove a/i }));

    // Add C — should reuse PALETTE[1] (least used), not PALETTE[2] (B's color)
    fireEvent.change(input, { target: { value: "C" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));

    const nonPayers = useBillStore.getState().people.filter((p) => !p.payer);
    const colors = nonPayers.map((p) => p.color);
    expect(new Set(colors).size).toBe(colors.length); // all unique
  });

  it("new person has payer: false", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Frank" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    const added = useBillStore
      .getState()
      .people.find((p) => p.name === "Frank");
    expect(added?.payer).toBe(false);
  });

  // ── People list ─────────────────────────────────────────────────────────────

  it("added person appears in the list", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Grace" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(screen.getByText("Grace")).toBeInTheDocument();
  });

  it("non-payer person has a remove button", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Hank" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(
      screen.getByRole("button", { name: /remove hank/i })
    ).toBeInTheDocument();
  });

  it("clicking remove deletes the person from the store", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Ivy" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove ivy/i }));
    expect(useBillStore.getState().people.map((p) => p.name)).not.toContain(
      "Ivy"
    );
  });

  it("removing a person keeps 'You' in the store", () => {
    render(<PeopleScreen />);
    const input = screen.getByRole("textbox", { name: /add a name/i });
    fireEvent.change(input, { target: { value: "Jack" } });
    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove jack/i }));
    expect(useBillStore.getState().people.find((p) => p.payer)).toBeTruthy();
  });

  // ── Recent chips ────────────────────────────────────────────────────────────

  it("renders quick-add 'Recent' section", () => {
    render(<PeopleScreen />);
    expect(screen.getByText(/recent/i)).toBeInTheDocument();
  });

  it("renders the four default quick-add chips", () => {
    render(<PeopleScreen />);
    for (const name of ["Diego", "Sam", "Aisha", "Theo"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(name, "i") })
      ).toBeInTheDocument();
    }
  });

  it("clicking a quick-add chip adds that person to the store", () => {
    render(<PeopleScreen />);
    fireEvent.click(screen.getByRole("button", { name: /diego/i }));
    expect(useBillStore.getState().people.map((p) => p.name)).toContain(
      "Diego"
    );
  });

  // ── Dock CTA ────────────────────────────────────────────────────────────────

  it("renders the 'Next · assign items' CTA", () => {
    render(<PeopleScreen />);
    expect(
      screen.getByRole("button", { name: /next.*assign items/i })
    ).toBeInTheDocument();
  });

  it("dock CTA advances step to 3", () => {
    act(() => {
      useBillStore.getState().setStep(2);
    });
    render(<PeopleScreen />);
    fireEvent.click(screen.getByRole("button", { name: /next.*assign items/i }));
    expect(useBillStore.getState().step).toBe(3);
  });
});
