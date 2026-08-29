import{describe,it,expect}from"vitest";
import{transition,type WorkflowState,type WorkflowEvent}from"../../lib/citizen-workflow";

describe("citizen-workflow transition",()=>{
  const EVENTS:WorkflowEvent["type"][]=[
    "FILE_SELECTED","EDIT","ANALYZE","READY","DISPATCH","ERROR","RESET",
  ];

  // ─── RESET always goes to idle ──────────────────────────────────
  describe("RESET",()=>{
    for(const s of["idle","editing","analyzing","ready","dispatched","error"] as WorkflowState[]){
      it(`RESET from ${s} → idle`,()=>{
        expect(transition(s,{type:"RESET"})).toBe("idle");
      });
    }
  });

  // ─── FILE_SELECTED ─────────────────────────────────────────────
  describe("FILE_SELECTED",()=>{
    it("from idle → editing",()=>expect(transition("idle",{type:"FILE_SELECTED"})).toBe("editing"));
    it("from error → editing",()=>expect(transition("error",{type:"FILE_SELECTED"})).toBe("editing"));
    it("from dispatched → editing",()=>expect(transition("dispatched",{type:"FILE_SELECTED"})).toBe("editing"));
    it("from editing → stays editing (no-op)",()=>expect(transition("editing",{type:"FILE_SELECTED"})).toBe("editing"));
    it("from analyzing → stays analyzing (no-op)",()=>expect(transition("analyzing",{type:"FILE_SELECTED"})).toBe("analyzing"));
    it("from ready → stays ready (no-op)",()=>expect(transition("ready",{type:"FILE_SELECTED"})).toBe("ready"));
  });

  // ─── EDIT ──────────────────────────────────────────────────────
  describe("EDIT",()=>{
    it("from idle → editing",()=>expect(transition("idle",{type:"EDIT"})).toBe("editing"));
    it("from editing → stays editing",()=>expect(transition("editing",{type:"EDIT"})).toBe("editing"));
    it("from analyzing → stays analyzing (no-op)",()=>expect(transition("analyzing",{type:"EDIT"})).toBe("analyzing"));
  });

  // ─── ANALYZE ───────────────────────────────────────────────────
  describe("ANALYZE",()=>{
    it("from editing → analyzing",()=>expect(transition("editing",{type:"ANALYZE"})).toBe("analyzing"));
    it("from idle → stays idle (no-op)",()=>expect(transition("idle",{type:"ANALYZE"})).toBe("idle"));
    it("from analyzing → stays analyzing (no-op)",()=>expect(transition("analyzing",{type:"ANALYZE"})).toBe("analyzing"));
  });

  // ─── READY ─────────────────────────────────────────────────────
  describe("READY",()=>{
    it("from analyzing → ready",()=>expect(transition("analyzing",{type:"READY"})).toBe("ready"));
    it("from idle → stays idle (no-op)",()=>expect(transition("idle",{type:"READY"})).toBe("idle"));
  });

  // ─── DISPATCH ──────────────────────────────────────────────────
  describe("DISPATCH",()=>{
    it("from ready → dispatched",()=>expect(transition("ready",{type:"DISPATCH"})).toBe("dispatched"));
    it("from idle → stays idle (no-op)",()=>expect(transition("idle",{type:"DISPATCH"})).toBe("idle"));
  });

  // ─── ERROR ─────────────────────────────────────────────────────
  describe("ERROR",()=>{
    for(const s of["idle","editing","analyzing","ready","dispatched","error"] as WorkflowState[]){
      it(`ERROR from ${s} → error`,()=>{
        expect(transition(s,{type:"ERROR"})).toBe("error");
      });
    }
  });

  // ─── Full happy path ───────────────────────────────────────────
  it("full flow: idle → editing → analyzing → ready → dispatched",()=>{
    let s:WorkflowState="idle";
    s=transition(s,{type:"FILE_SELECTED"});expect(s).toBe("editing");
    s=transition(s,{type:"ANALYZE"});expect(s).toBe("analyzing");
    s=transition(s,{type:"READY"});expect(s).toBe("ready");
    s=transition(s,{type:"DISPATCH"});expect(s).toBe("dispatched");
  });

  // ─── Error recovery ────────────────────────────────────────────
  it("error recovery: editing → analyzing → error → FILE_SELECTED → editing",()=>{
    let s:WorkflowState="editing";
    s=transition(s,{type:"ANALYZE"});expect(s).toBe("analyzing");
    s=transition(s,{type:"ERROR"});expect(s).toBe("error");
    s=transition(s,{type:"FILE_SELECTED"});expect(s).toBe("editing");
  });
});
