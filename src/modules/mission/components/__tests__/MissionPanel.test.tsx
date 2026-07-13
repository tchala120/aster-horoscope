import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mission } from "@/shared";
import { MissionPanel } from "../MissionPanel";

const assigned: Mission = {
  id: "m1",
  cardRef: "the-star",
  featureRef: "active_participant",
  difficulty: "easy",
  deadline: "",
  status: "assigned",
};

describe("MissionPanel", () => {
  it("shows Accept/Reject for an assigned mission and calls handlers", async () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <MissionPanel mission={assigned} onAccept={onAccept} onReject={onReject} onComplete={() => {}} />,
    );
    expect(screen.getByText("Active Participant")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(onAccept).toHaveBeenCalledWith("m1");
    expect(onReject).toHaveBeenCalledWith("m1");
  });

  it("shows the completion action + countdown for an active mission", () => {
    const active: Mission = {
      ...assigned,
      status: "active",
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
    };
    render(
      <MissionPanel mission={active} onAccept={() => {}} onReject={() => {}} onComplete={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "I did it" })).toBeInTheDocument();
    expect(screen.getByLabelText("Time until next draw")).toBeInTheDocument();
  });
});
