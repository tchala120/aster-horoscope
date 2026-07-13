import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Countdown } from "@/foundation/ui/components/Countdown";

describe("Countdown", () => {
  it("renders a HH:MM:SS countdown toward the target", () => {
    const target = new Date(Date.now() + 3661_000).toISOString(); // ~1h 1m 1s
    render(<Countdown targetIso={target} />);
    const el = screen.getByLabelText("Time until next draw");
    expect(el.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
