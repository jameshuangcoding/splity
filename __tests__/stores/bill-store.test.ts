/**
 * @jest-environment jsdom
 */
import { useBillStore } from "@/stores/bill-store";

// Reset store state between tests
beforeEach(() => {
  useBillStore.getState().reset();
});

describe("bill-store — initial state", () => {
  it("starts at step 0", () => {
    expect(useBillStore.getState().step).toBe(0);
  });

  it("starts in dark theme", () => {
    expect(useBillStore.getState().theme).toBe("dark");
  });

  it("starts with empty name", () => {
    expect(useBillStore.getState().name).toBe("");
  });

  it('starts with a single "You" payer person', () => {
    const { people } = useBillStore.getState();
    expect(people).toHaveLength(1);
    expect(people[0].payer).toBe(true);
    expect(people[0].id).toBe("you");
  });

  it("starts with no assignments", () => {
    expect(useBillStore.getState().assignments).toEqual({});
  });
});

describe("bill-store — step navigation", () => {
  it("nextStep increments step", () => {
    useBillStore.getState().nextStep();
    expect(useBillStore.getState().step).toBe(1);
  });

  it("prevStep decrements step", () => {
    useBillStore.setState({ step: 3 });
    useBillStore.getState().prevStep();
    expect(useBillStore.getState().step).toBe(2);
  });

  it("nextStep clamps at 5", () => {
    useBillStore.setState({ step: 5 });
    useBillStore.getState().nextStep();
    expect(useBillStore.getState().step).toBe(5);
  });

  it("prevStep clamps at 0", () => {
    useBillStore.setState({ step: 0 });
    useBillStore.getState().prevStep();
    expect(useBillStore.getState().step).toBe(0);
  });

  it("setStep sets an arbitrary step", () => {
    useBillStore.getState().setStep(4);
    expect(useBillStore.getState().step).toBe(4);
  });
});

describe("bill-store — name", () => {
  it("setName updates the expense name", () => {
    useBillStore.getState().setName("East Asia dinner");
    expect(useBillStore.getState().name).toBe("East Asia dinner");
  });
});

describe("bill-store — inputMode", () => {
  it("starts with null inputMode", () => {
    expect(useBillStore.getState().inputMode).toBeNull();
  });

  it("setInputMode sets scan", () => {
    useBillStore.getState().setInputMode("scan");
    expect(useBillStore.getState().inputMode).toBe("scan");
  });

  it("setInputMode sets manual", () => {
    useBillStore.getState().setInputMode("manual");
    expect(useBillStore.getState().inputMode).toBe("manual");
  });

  it("reset clears inputMode back to null", () => {
    useBillStore.getState().setInputMode("scan");
    useBillStore.getState().reset();
    expect(useBillStore.getState().inputMode).toBeNull();
  });
});

describe("bill-store — theme toggle", () => {
  it("toggleTheme switches from dark to light", () => {
    useBillStore.getState().toggleTheme();
    expect(useBillStore.getState().theme).toBe("light");
  });

  it("toggleTheme switches back to dark", () => {
    useBillStore.setState({ theme: "light" });
    useBillStore.getState().toggleTheme();
    expect(useBillStore.getState().theme).toBe("dark");
  });

  it("setTheme sets theme directly", () => {
    useBillStore.getState().setTheme("light");
    expect(useBillStore.getState().theme).toBe("light");
  });
});

describe("bill-store — reset", () => {
  it("reset clears all state back to initial", () => {
    useBillStore.setState({
      step: 4,
      name: "Dinner",
      theme: "light",
      assignments: { item1: ["p1"] },
    });
    useBillStore.getState().reset();
    const state = useBillStore.getState();
    expect(state.step).toBe(0);
    expect(state.name).toBe("");
    expect(state.theme).toBe("dark");
    expect(state.assignments).toEqual({});
  });
});
