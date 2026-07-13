import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpreadCardView } from "../SpreadCardView";

describe("SpreadCardView", () => {
  it("renders a face-down, labelled card button", () => {
    render(<SpreadCardView index={0} picked={false} rejected={false} reducedMotion onSelect={() => {}} />);
    expect(screen.getByLabelText("Tarot card 1, face down")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const onSelect = vi.fn();
    render(<SpreadCardView index={2} picked={false} rejected={false} reducedMotion onSelect={onSelect} />);
    await userEvent.click(screen.getByLabelText("Tarot card 3, face down"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("is disabled when rejected", () => {
    render(<SpreadCardView index={0} picked={false} rejected reducedMotion onSelect={() => {}} />);
    expect(screen.getByLabelText("Tarot card 1, face down")).toBeDisabled();
  });
});
