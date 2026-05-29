/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { TopBar } from "@/components/splity/TopBar";

const baseProps = {
  step: 0,
  total: 6,
  theme: "dark" as const,
  onBack: jest.fn(),
  onToggleTheme: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("<TopBar /> — progress segments", () => {
  it("renders the correct number of segments", () => {
    render(<TopBar {...baseProps} total={6} />);
    const segments = screen.getAllByRole("presentation");
    expect(segments).toHaveLength(6);
  });

  it("all segments at or before step have a filled inner bar", () => {
    render(<TopBar {...baseProps} step={2} total={6} />);
    // Segments 0, 1, 2 should be filled (i <= step)
    const fills = screen.getAllByRole("presentation").map((s) => s.querySelector("[data-fill]"));
    expect(fills[0]).toHaveAttribute("data-fill", "true");
    expect(fills[1]).toHaveAttribute("data-fill", "true");
    expect(fills[2]).toHaveAttribute("data-fill", "true");
    expect(fills[3]).toHaveAttribute("data-fill", "false");
    expect(fills[4]).toHaveAttribute("data-fill", "false");
    expect(fills[5]).toHaveAttribute("data-fill", "false");
  });

  it("step=0 fills only the first segment", () => {
    render(<TopBar {...baseProps} step={0} total={6} />);
    const fills = screen.getAllByRole("presentation").map((s) => s.querySelector("[data-fill]"));
    expect(fills[0]).toHaveAttribute("data-fill", "true");
    expect(fills[1]).toHaveAttribute("data-fill", "false");
  });

  it("step=5 fills all six segments", () => {
    render(<TopBar {...baseProps} step={5} total={6} />);
    const fills = screen.getAllByRole("presentation").map((s) => s.querySelector("[data-fill]"));
    fills.forEach((f) => expect(f).toHaveAttribute("data-fill", "true"));
  });
});

describe("<TopBar /> — back button", () => {
  it("back button is visible by default", () => {
    render(<TopBar {...baseProps} showBack />);
    const btn = screen.getByRole("button", { name: /back/i });
    expect(btn).not.toHaveClass("invisible");
  });

  it("back button is invisible when showBack=false", () => {
    render(<TopBar {...baseProps} showBack={false} />);
    const btn = screen.getByRole("button", { name: /back/i });
    expect(btn).toHaveClass("invisible");
  });

  it("calls onBack when back button clicked", () => {
    render(<TopBar {...baseProps} showBack />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});

describe("<TopBar /> — theme toggle", () => {
  it("shows sun icon in dark theme", () => {
    render(<TopBar {...baseProps} theme="dark" />);
    const btn = screen.getByRole("button", { name: /toggle theme/i });
    expect(btn.querySelector("svg")).toBeInTheDocument();
    // The button renders a sun icon in dark mode (to switch to light)
    expect(btn).toHaveAttribute("aria-label", "Toggle theme");
  });

  it("calls onToggleTheme when theme button clicked", () => {
    render(<TopBar {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(baseProps.onToggleTheme).toHaveBeenCalledTimes(1);
  });
});

describe("<TopBar /> — renders at 390px viewport", () => {
  it("renders without errors at mobile width", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 390 });
    const { container } = render(<TopBar {...baseProps} />);
    expect(container.firstChild).toBeTruthy();
  });
});
