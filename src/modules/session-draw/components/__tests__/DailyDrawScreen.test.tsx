import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Spread } from "@/shared";
import { DailyDrawScreen } from "../DailyDrawScreen";

const resetAt = new Date(Date.now() + 3600_000).toISOString();

function makeSpread(n: number): Spread {
  return Array.from({ length: n }, (_, i) => ({
    cardId: `card-${i}`,
    picked: false,
    rejected: false,
  }));
}

describe("DailyDrawScreen", () => {
  it("shows the draw CTA when drawable and triggers onDraw", async () => {
    const onDraw = vi.fn();
    render(
      <DailyDrawScreen
        spread={[]}
        drawable
        resetAt={resetAt}
        reducedMotion
        onDraw={onDraw}
        onReroll={() => {}}
        onPick={() => {}}
      />,
    );
    const btn = screen.getByRole("button", { name: "Draw a Card" });
    await userEvent.click(btn);
    expect(onDraw).toHaveBeenCalledOnce();
  });

  it("renders the spread of cards to pick when not drawable", () => {
    render(
      <DailyDrawScreen
        spread={makeSpread(10)}
        drawable={false}
        resetAt={resetAt}
        reducedMotion
        onDraw={() => {}}
        onReroll={() => {}}
        onPick={() => {}}
      />,
    );
    expect(screen.getAllByLabelText(/face down/)).toHaveLength(10);
  });

  it("shows the locked state with a countdown when no spread and not drawable", () => {
    render(
      <DailyDrawScreen
        spread={[]}
        drawable={false}
        resetAt={resetAt}
        reducedMotion
        onDraw={() => {}}
        onReroll={() => {}}
        onPick={() => {}}
      />,
    );
    expect(screen.getByText("Come back tomorrow")).toBeInTheDocument();
    expect(screen.getByLabelText("Time until next draw")).toBeInTheDocument();
  });
});
