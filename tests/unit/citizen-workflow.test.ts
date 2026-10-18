import { describe, expect, it } from "vitest";
import {
  transition,
  type WorkflowEvent,
  type WorkflowState,
} from "../../lib/citizen-workflow";

type TransitionCase = readonly [
  WorkflowEvent["type"],
  WorkflowState,
  WorkflowState,
];

const TRANSITIONS: TransitionCase[] = [
  ["RESET", "idle", "idle"],
  ["RESET", "editing", "idle"],
  ["RESET", "analyzing", "idle"],
  ["RESET", "ready", "idle"],
  ["RESET", "dispatched", "idle"],
  ["RESET", "error", "idle"],
  ["FILE_SELECTED", "idle", "editing"],
  ["FILE_SELECTED", "error", "editing"],
  ["FILE_SELECTED", "dispatched", "editing"],
  ["FILE_SELECTED", "editing", "editing"],
  ["FILE_SELECTED", "analyzing", "analyzing"],
  ["FILE_SELECTED", "ready", "ready"],
  ["EDIT", "idle", "editing"],
  ["EDIT", "editing", "editing"],
  ["EDIT", "analyzing", "analyzing"],
  ["ANALYZE", "editing", "analyzing"],
  ["ANALYZE", "idle", "idle"],
  ["ANALYZE", "analyzing", "analyzing"],
  ["READY", "analyzing", "ready"],
  ["READY", "idle", "idle"],
  ["DISPATCH", "ready", "dispatched"],
  ["DISPATCH", "idle", "idle"],
  ["ERROR", "idle", "error"],
  ["ERROR", "editing", "error"],
  ["ERROR", "analyzing", "error"],
  ["ERROR", "ready", "error"],
  ["ERROR", "dispatched", "error"],
  ["ERROR", "error", "error"],
];

describe("citizen-workflow transition", () => {
  it.each(TRANSITIONS)("%s: %s -> %s", (event, from, expected) => {
    expect(transition(from, { type: event })).toBe(expected);
  });
});
