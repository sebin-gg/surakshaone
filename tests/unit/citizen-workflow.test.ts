import{describe,it,expect}from"vitest";
import{transition,type WorkflowState,type WorkflowEvent}from"../../lib/citizen-workflow";

type TransitionCase={from:WorkflowState;to:WorkflowState};

const STATES:WorkflowState[]=["idle","editing","analyzing","ready","dispatched","error"];

function testTransitions(event:WorkflowEvent["type"],cases:TransitionCase[]){
  describe(event,()=>{
    it.each(cases)("from $from → $to",({from,to})=>{
      expect(transition(from,{type:event})).toBe(to);
    });
  });
}

describe("citizen-workflow transition",()=>{
  // ─── RESET always goes to idle ──────────────────────────────────
  testTransitions("RESET",STATES.map((from):TransitionCase=>({from,to:"idle"})));

  // ─── FILE_SELECTED ─────────────────────────────────────────────
  testTransitions("FILE_SELECTED",[
    {from:"idle",to:"editing"},
    {from:"error",to:"editing"},
    {from:"dispatched",to:"editing"},
    {from:"editing",to:"editing"},
    {from:"analyzing",to:"analyzing"},
    {from:"ready",to:"ready"},
  ]);

  // ─── EDIT ──────────────────────────────────────────────────────
  testTransitions("EDIT",[
    {from:"idle",to:"editing"},
    {from:"editing",to:"editing"},
    {from:"analyzing",to:"analyzing"},
  ]);

  // ─── ANALYZE ───────────────────────────────────────────────────
  testTransitions("ANALYZE",[
    {from:"editing",to:"analyzing"},
    {from:"idle",to:"idle"},
    {from:"analyzing",to:"analyzing"},
  ]);

  // ─── READY ─────────────────────────────────────────────────────
  testTransitions("READY",[
    {from:"analyzing",to:"ready"},
    {from:"idle",to:"idle"},
  ]);

  // ─── DISPATCH ──────────────────────────────────────────────────
  testTransitions("DISPATCH",[
    {from:"ready",to:"dispatched"},
    {from:"idle",to:"idle"},
  ]);

  // ─── ERROR ─────────────────────────────────────────────────────
  testTransitions("ERROR",STATES.map((from):TransitionCase=>({from,to:"error"})));

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
