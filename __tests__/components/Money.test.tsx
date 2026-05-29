/**
 * @jest-environment jsdom
 */
import { render, screen, act } from "@testing-library/react";
import { Money } from "@/components/splity/Money";

const mockMatchMedia = (prefersReduced: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: prefersReduced && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
};

beforeEach(() => {
  mockMatchMedia(false);
  // Advance time past dur (520ms) so the tick resolves to k=1 in a single call
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(performance.now() + 1000);
    return 0;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("<Money />", () => {
  it("renders value on initial mount", () => {
    render(<Money value={12.34} />);
    expect(screen.getByText("$12.34")).toBeInTheDocument();
  });

  it("shows negative sign and absolute value for negative numbers", () => {
    render(<Money value={-5.5} />);
    expect(screen.getByText("-$5.50")).toBeInTheDocument();
  });

  it("formats to exactly 2 decimal places", () => {
    render(<Money value={10} />);
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("uses custom prefix", () => {
    render(<Money value={8.0} prefix="€" />);
    expect(screen.getByText("€8.00")).toBeInTheDocument();
  });

  it("applies additional className", () => {
    render(<Money value={1} className="test-money" />);
    const el = screen.getByText("$1.00");
    expect(el.className).toContain("test-money");
  });

  it("jumps immediately to new value with prefers-reduced-motion", async () => {
    mockMatchMedia(true);
    const { rerender } = render(<Money value={10} />);
    await act(async () => {
      rerender(<Money value={99.99} />);
    });
    expect(screen.getByText("$99.99")).toBeInTheDocument();
  });

  it("renders zero as $0.00", () => {
    render(<Money value={0} />);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });
});
