/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ScreenHead } from "@/components/splity/ScreenHead";

describe("<ScreenHead />", () => {
  it("renders title", () => {
    render(<ScreenHead title="Who had what?" />);
    expect(screen.getByText("Who had what?")).toBeInTheDocument();
  });

  it("renders eyebrow when provided", () => {
    render(<ScreenHead title="Title" eyebrow="Step 3" />);
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("does not render eyebrow element when omitted", () => {
    render(<ScreenHead title="Title" />);
    expect(screen.queryByTestId("eyebrow")).not.toBeInTheDocument();
  });

  it("renders sub when provided", () => {
    render(<ScreenHead title="Title" sub="Subtitle text here" />);
    expect(screen.getByText("Subtitle text here")).toBeInTheDocument();
  });

  it("does not render sub element when omitted", () => {
    render(<ScreenHead title="Title" />);
    expect(screen.queryByTestId("sub")).not.toBeInTheDocument();
  });

  it("applies eyebrow uppercase styling via className", () => {
    render(<ScreenHead title="Title" eyebrow="LABEL" />);
    const el = screen.getByText("LABEL");
    expect(el.className).toMatch(/uppercase/);
  });

  it("applies large font-weight to title", () => {
    render(<ScreenHead title="Big Title" />);
    const el = screen.getByText("Big Title");
    expect(el.className).toMatch(/font-extrabold|font-bold/);
  });
});
