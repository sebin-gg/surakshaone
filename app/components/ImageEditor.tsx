"use client";
import {useEffect,useState} from "react";

export default function ImageEditor({file,onUse,onCancel}:{file:File;onUse:(f:File)=>void;onCancel:()=>void}){
  const[src,setSrc]=useState("");
  const[quality,setQuality]=useState(.78);

  useEffect(()=>{
    const u=URL.createObjectURL(file);setSrc(u);
    return()=>URL.revokeObjectURL(u);
  },[file]);

  function save(){
    const i=new Image();
    i.onload=()=>{
      const scale=Math.min(1,1800/Math.max(i.width,i.height));
      const c=document.createElement("canvas");
      c.width=Math.round(i.width*scale);
      c.height=Math.round(i.height*scale);
      c.getContext("2d")?.drawImage(i,0,0,c.width,c.height);
      c.toBlob(b=>b&&onUse(new File([b],"evidence.jpg",{type:"image/jpeg"})),"image/jpeg",quality);
    };
    i.src=src;
  }

  return(
    <div className="glass mt-4 rounded-2xl p-4">
      <div className="flex justify-between text-sm font-bold">
        Edit screenshot
        <button onClick={onCancel} className="text-xs text-slate-400 underline">Cancel</button>
      </div>
      <img src={src} alt="Screenshot preview" className="mt-4 max-h-56 w-full rounded-xl object-contain"/>
      <label className="mt-4 block text-xs text-slate-400">
        Compression: {Math.round(quality*100)}%
        <input aria-label="Compression quality" type="range" min=".35" max="1" step=".05" value={quality} onChange={e=>setQuality(+e.target.value)} className="mt-2 w-full accent-cyan-300"/>
      </label>
      <button onClick={save} className="mt-4 w-full rounded-xl bg-cyan-300 py-3 text-sm font-black text-slate-950">USE EDITED IMAGE</button>
    </div>
  );
}
