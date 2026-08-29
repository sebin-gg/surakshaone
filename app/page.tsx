"use client";
import {useEffect,useReducer,useCallback,useRef} from "react";
import ImageEditor from "./components/ImageEditor";
import {transition,type WorkflowState,type WorkflowEvent} from "../lib/citizen-workflow";

type Claim={utr:string;payeeVpa:string;amountInr:number;fraudVector:string;summary:string};

type AppState={
  state:WorkflowState;
  file:File|null;
  claim:Claim|null;
  error:string;
};

const INITIAL:AppState={state:"idle",file:null,claim:null,error:""};

function reducer(app:AppState,event:WorkflowEvent):AppState{
  const next=transition(app.state,event);
  if(next===app.state&&event.type!=="RESET")return app;
  switch(event.type){
    case"FILE_SELECTED":return{...app,state:next,error:""};
    case"EDIT":return{...app,state:next};
    case"ANALYZE":return{...app,state:next,error:""};
    case"READY":return{...app,state:next};
    case"DISPATCH":return{...app,state:next};
    case"ERROR":return{...app,state:next,error:"Upload failed. Try again."};
    case"RESET":return{INITIAL};
    default:return{...app,state:next};
  }
}

export default function Home(){
  const[app,dispatch]=useReducer(reducer,INITIAL);
  const appRef=useRef(app);
  appRef.current=app;

  useEffect(()=>{navigator.serviceWorker?.register("/sw.js").catch(()=>{})},[]);

  const handleFile=useCallback((f:File|null)=>{
    if(f){dispatch({type:"FILE_SELECTED"});appRef.current={...appRef.current,file:f}}
  },[]);

  const go=useCallback(async()=>{
    const file=appRef.current.file;
    if(!file)return;
    dispatch({type:"ANALYZE"});
    try{
      const fd=new FormData();fd.append("screenshot",file);
      const r=await fetch("/api/claim",{method:"POST",body:fd}),j=await r.json();
      if(!r.ok){dispatch({type:"ERROR"});appRef.current={...appRef.current,error:j.error}}
      else{dispatch({type:"READY"});appRef.current={...appRef.current,claim:j.claim}}
    }catch{dispatch({type:"ERROR"});appRef.current={...appRef.current,error:"Network error"}}
  },[]);

  const busy=app.state==="analyzing";
  const editing=app.state==="editing";

  return(
    <main role="main" className="grid-bg min-h-screen">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl justify-between px-5 py-6">
        <b className="text-lg">SURAKSHA<span className="text-cyan-300">ONE</span></b>
        <a href="tel:1930" aria-label="Emergency cybercrime helpline: call 1930" className="rounded-full border border-slate-700 px-4 py-2 text-xs">Emergency: 1930</a>
      </nav>
      <section aria-label="Fraud evidence upload" className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-cyan-300">Fraud response desk</p>
            <h1 className="mt-5 text-5xl font-black sm:text-7xl">Freeze the trail.<br/><span className="text-cyan-300">Start now.</span></h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">Turn one payment screenshot into organised evidence for your bank and cybercrime helpline.</p>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="font-bold">Upload transaction proof</p>
            <label aria-label="Upload transaction screenshot" className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 p-6 text-center hover:border-cyan-400">
              <input aria-label="Upload transaction screenshot" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e=>{const f=e.target.files?.[0]??null;handleFile(f)}}/>
              <span className="text-3xl text-cyan-300" aria-hidden="true">↑</span>
              <b className="mt-3 text-sm">{app.file?app.file.name:"Choose screenshot"}</b>
              <small className="mt-2 text-slate-500">JPG, PNG, WEBP or GIF</small>
            </label>
            {app.file&&!editing&&app.state==="idle"&&<button aria-label="Crop or compress image" onClick={()=>dispatch({type:"EDIT"})} className="mt-3 w-full rounded-xl border border-slate-600 py-3 text-xs font-bold">CROP / COMPRESS IMAGE</button>}
            {app.file&&editing&&<ImageEditor file={app.file} onUse={f=>{appRef.current={...appRef.current,file:f};dispatch({type:"EDIT"})}} onCancel={()=>dispatch({type:"RESET"})}/>}
            <button aria-label={busy?"Analyzing screenshot...":"Analyse screenshot"} disabled={!app.file||busy||editing} onClick={go} className="mt-4 w-full rounded-xl bg-cyan-300 py-4 text-sm font-black text-slate-950 disabled:opacity-40">{busy?"READING EVIDENCE…":"ANALYSE SCREENSHOT"}</button>
            {app.error&&<p role="alert" aria-live="assertive" className="mt-3 text-xs text-red-300">{app.error}</p>}
          </div>
        </div>
        {app.claim&&app.state==="ready"&&(
          <div role="status" aria-live="polite" className="glass mx-auto mt-10 max-w-2xl rounded-3xl p-6">
            <h2 className="font-black text-cyan-300">Evidence package ready</h2>
            <p className="mt-4">₹{app.claim.amountInr.toLocaleString("en-IN")} · {app.claim.utr||"UTR not found"}</p>
            <p className="mt-3 text-sm text-slate-300">{app.claim.summary}</p>
            <button aria-label="Dispatch evidence and call 1930 cybercrime helpline" onClick={()=>{dispatch({type:"DISPATCH"});window.location.href="tel:1930"}} className="mt-5 w-full rounded-xl bg-white py-4 text-sm font-black text-slate-950">DISPATCH &amp; CALL 1930</button>
          </div>
        )}
      </section>
    </main>
  );
}
