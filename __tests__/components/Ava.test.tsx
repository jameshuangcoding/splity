/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { Ava, AvaStack, shade } from "@/components/splity/Ava";
import type { StorePerson } from "@/types";

const alice: StorePerson = { id: "1", name: "Alice", initial: "A", color: "#ff7a4d", payer: false };
const bob: StorePerson = { id: "2", name: "Bob", initial: "B", color: "#3ddc97", payer: false };
const you: StorePerson = { id: "you", name: "You", initial: "Y", color: "#ff7a4d", payer: true };

// ─── shade() ─────────────────────────────────────────────────────────────────

describe("shade()", () => {
  it("darkens a hex color by the given amount", () => {
    // #ff7a4d → r=255-18=237=0xed, g=122-18=104=0x68, b=77-18=59=0x3b
    const result = shade("#ff7a4d", -18);
    expect(result).toBe("#ed683b");
  });

  it("lightens a hex color by the given amount", () => {
    // #ff7a4d → r=255+18→clamp 255=0xff, g=122+18=140=0x8c, b=77+18=95=0x5f
    const result = shade("#ff7a4d", 18);
    expect(result).toBe("#ff8c5f");
  });

  it("clamps red channel at 0", () => {
    const result = shade("#0a0000", -100);
    expect(result.startsWith("#00")).toBe(true);
  });

  it("clamps channels at 255", () => {
    const result = shade("#ffffff", 100);
    expect(result).toBe("#ffffff");
  });
});

// ─── <Ava /> ─────────────────────────────────────────────────────────────────

describe("<Ava />", () => {
  it("renders person initial", () => {
    render(<Ava person={alice} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("applies gradient background with person color", () => {
    render(<Ava person={alice} />);
    const el = screen.getByText("A");
    expect(el.style.background).toContain(alice.color);
  });

  it("sm variant applies smaller size class", () => {
    render(<Ava person={alice} size="sm" />);
    const el = screen.getByText("A");
    expect(el.className).toContain("w-7");
  });

  it("lg variant applies larger size class", () => {
    render(<Ava person={alice} size="lg" />);
    const el = screen.getByText("A");
    expect(el.className).toContain("w-[46px]");
  });

  it("ghost variant renders without gradient background", () => {
    render(<Ava person={alice} ghost />);
    const el = screen.getByText("A");
    expect(el.style.background).toBeFalsy();
  });

  it("off variant applies grayscale and opacity classes", () => {
    render(<Ava person={alice} off />);
    const el = screen.getByText("A");
    expect(el.className).toMatch(/grayscale|opacity/);
  });

  it("passes additional className", () => {
    render(<Ava person={alice} className="test-class" />);
    const el = screen.getByText("A");
    expect(el.className).toContain("test-class");
  });
});

// ─── <AvaStack /> ────────────────────────────────────────────────────────────

describe("<AvaStack />", () => {
  it("renders an avatar for each person", () => {
    render(<AvaStack people={[alice, bob, you]} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("Y")).toBeInTheDocument();
  });

  it("applies negative margin to all but first avatar", () => {
    render(<AvaStack people={[alice, bob]} />);
    const avaEls = screen.getAllByText(/[ABY]/);
    expect(avaEls[0].className).not.toContain("-ml-");
    expect(avaEls[1].className).toContain("-ml-");
  });

  it("renders empty stack without crashing", () => {
    render(<AvaStack people={[]} />);
  });
});
