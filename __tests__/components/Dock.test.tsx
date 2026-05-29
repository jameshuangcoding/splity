/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { Dock } from "@/components/splity/Dock";

describe("<Dock />", () => {
  const primaryFn = jest.fn();
  const ghostFn = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("renders primary CTA label", () => {
    render(<Dock primary={{ label: "Scan a receipt", onClick: primaryFn }} />);
    expect(screen.getByText("Scan a receipt")).toBeInTheDocument();
  });

  it("calls primary onClick when clicked", () => {
    render(<Dock primary={{ label: "Go", onClick: primaryFn }} />);
    fireEvent.click(screen.getByText("Go"));
    expect(primaryFn).toHaveBeenCalledTimes(1);
  });

  it("renders ghost CTA when provided", () => {
    render(
      <Dock
        primary={{ label: "Primary", onClick: primaryFn }}
        ghost={{ label: "Enter manually", onClick: ghostFn }}
      />
    );
    expect(screen.getByText("Enter manually")).toBeInTheDocument();
  });

  it("calls ghost onClick when clicked", () => {
    render(
      <Dock
        primary={{ label: "Primary", onClick: primaryFn }}
        ghost={{ label: "Ghost", onClick: ghostFn }}
      />
    );
    fireEvent.click(screen.getByText("Ghost"));
    expect(ghostFn).toHaveBeenCalledTimes(1);
  });

  it("does not render ghost button when not provided", () => {
    render(<Dock primary={{ label: "Only primary", onClick: primaryFn }} />);
    expect(screen.queryByRole("button")).toHaveTextContent("Only primary");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("primary button is disabled when disabled=true", () => {
    render(
      <Dock primary={{ label: "Disabled", onClick: primaryFn, disabled: true }} />
    );
    expect(screen.getByText("Disabled").closest("button")).toBeDisabled();
  });

  it("renders ReactNode label with icon", () => {
    render(
      <Dock
        primary={{
          label: <span data-testid="icon-label">Icon + Text</span>,
          onClick: primaryFn,
        }}
      />
    );
    expect(screen.getByTestId("icon-label")).toBeInTheDocument();
  });
});
