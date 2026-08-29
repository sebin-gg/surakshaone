/**
 * Citizen Workflow — State machine for the fraud evidence upload flow.
 *
 * States: idle → editing → analyzing → ready → dispatched
 *                                  ↘ error
 *
 * Every user action maps to an event. The transition function is pure:
 * (state, event) → newState. No side effects.
 */

export type WorkflowState =
  | "idle"
  | "editing"
  | "analyzing"
  | "ready"
  | "dispatched"
  | "error";

export type WorkflowEvent =
  | { type: "FILE_SELECTED" }
  | { type: "EDIT" }
  | { type: "ANALYZE" }
  | { type: "READY" }
  | { type: "DISPATCH" }
  | { type: "ERROR" }
  | { type: "RESET" };

/**
 * Pure transition function. Returns the next state given current state + event.
 * Invalid transitions return the current state (no-op).
 */
export function transition(
  state: WorkflowState,
  event: WorkflowEvent
): WorkflowState {
  switch (event.type) {
    case "RESET":
      return "idle";

    case "FILE_SELECTED":
      // From idle or error, go to editing. From dispatched, restart.
      if (state === "idle" || state === "error" || state === "dispatched")
        return "editing";
      return state;

    case "EDIT":
      if (state === "editing" || state === "idle") return "editing";
      return state;

    case "ANALYZE":
      if (state === "editing") return "analyzing";
      return state;

    case "READY":
      if (state === "analyzing") return "ready";
      return state;

    case "DISPATCH":
      if (state === "ready") return "dispatched";
      return state;

    case "ERROR":
      return "error";

    default:
      return state;
  }
}
