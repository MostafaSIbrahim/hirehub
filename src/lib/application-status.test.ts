import { describe, expect, it } from "vitest";
import { canEmployerMove, canWithdraw, employerNextStatuses, type ApplicationStatus } from "./application-status";

const OPEN: ApplicationStatus[] = ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED"];
const FINAL: ApplicationStatus[] = ["HIRED", "REJECTED", "WITHDRAWN"];

describe("employer transitions", () => {
  it("moves forward one step", () => {
    expect(canEmployerMove("SUBMITTED", "REVIEWING")).toBe(true);
    expect(canEmployerMove("OFFERED", "HIRED")).toBe(true);
  });

  it("may skip forward (fast-track)", () => {
    expect(canEmployerMove("SUBMITTED", "INTERVIEW")).toBe(true);
  });

  it("never moves backwards", () => {
    expect(canEmployerMove("INTERVIEW", "REVIEWING")).toBe(false);
    expect(canEmployerMove("HIRED", "SUBMITTED")).toBe(false);
  });

  it("can reject any open application", () => {
    for (const status of OPEN) expect(canEmployerMove(status, "REJECTED")).toBe(true);
  });

  it("cannot move a final application at all", () => {
    for (const status of FINAL) expect(employerNextStatuses(status)).toEqual([]);
  });

  it("cannot withdraw on the seeker's behalf or 'move' to the same status", () => {
    expect(canEmployerMove("REVIEWING", "WITHDRAWN")).toBe(false);
    expect(canEmployerMove("REVIEWING", "REVIEWING")).toBe(false);
  });
});

describe("seeker withdraw", () => {
  it("is allowed while the application is open", () => {
    for (const status of OPEN) expect(canWithdraw(status)).toBe(true);
  });
  it("is not allowed once final", () => {
    for (const status of FINAL) expect(canWithdraw(status)).toBe(false);
  });
});