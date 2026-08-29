/**
 * Claim Intake — Adapter pattern for extracting fraud evidence from screenshots.
 *
 * The public API is extractClaim(file): Promise<Claim>.
 * It owns env validation, adapter selection, and extraction.
 * Callers never touch OpenAI directly.
 */

import OpenAI from "openai";
import {z} from "zod";

export const claimSchema=z.object({
  utr:z.string(),
  payeeVpa:z.string(),
  amountInr:z.number(),
  timestamp:z.string(),
  fraudVector:z.string(),
  summary:z.string(),
});

export type Claim=z.infer<typeof claimSchema>;

export const allowedImageTypes=["image/jpeg","image/png","image/webp","image/gif"] as const;
export const MAX_IMAGE_BYTES=8*1024*1024;

// ─── Adapter interface ───────────────────────────────────────────────

export type ClaimAdapter={extract(file:File):Promise<Claim>};

// ─── Built-in adapters ───────────────────────────────────────────────

export function demoAdapter():ClaimAdapter{
  return{async extract(){
    return claimSchema.parse({
      utr:"DEMO-4281908129",
      payeeVpa:"scammer@ybl",
      amountInr:15000,
      timestamp:new Date().toISOString(),
      fraudVector:"UPI impersonation",
      summary:"Demo extraction. Add OpenAI key for real screenshot OCR.",
    });
  }};
}

export function visionAdapter(
  client=new OpenAI({apiKey:process.env.OPENAI_API_KEY})
):ClaimAdapter{
  return{async extract(file){
    const b64=Buffer.from(await file.arrayBuffer()).toString("base64");
    const r=await client.chat.completions.create({
      model:"gpt-4o-mini",
      temperature:0,
      response_format:{type:"json_object"},
      messages:[
        {role:"system",content:"Extract UPI fraud transaction fields. Return JSON only: utr, payeeVpa, amountInr number, timestamp, fraudVector, summary. Use empty strings when unreadable; never invent values."},
        {role:"user",content:[
          {type:"text",text:"Analyze screenshot. OCR transaction details. Mark uncertain fields empty."},
          {type:"image_url",image_url:{url:`data:${file.type};base64,${b64}`,detail:"low"}},
        ]},
      ],
      signal:AbortSignal.timeout(45000),
    });
    return claimSchema.parse(JSON.parse(r.choices[0]?.message?.content??"{}"));
  }};
}

// ─── Public API ──────────────────────────────────────────────────────

export class ClaimIntakeError extends Error{
  constructor(message:string,readonly status:number){super(message);this.name="ClaimIntakeError"}}
export class MissingApiKeyError extends ClaimIntakeError{
  constructor(){super("OPENAI_API_KEY missing. Set DEMO_MODE=true for offline demo.",503)}}

/**
 * Extract claim from a screenshot file.
 * Owns the full decision: validates env → picks adapter → extracts → validates schema.
 */
export async function extractClaim(file:File):Promise<Claim>{
  if(!allowedImageTypes.includes(file.type as typeof allowedImageTypes[number]))
    throw new ClaimIntakeError("Upload JPG, PNG, WEBP, or GIF screenshot.",400);
  if(file.size>MAX_IMAGE_BYTES)
    throw new ClaimIntakeError("Image must be under 8 MB.",413);

  const hasKey=!!process.env.OPENAI_API_KEY;
  const demoMode=process.env.DEMO_MODE==="true";

  if(!hasKey&&!demoMode) throw new MissingApiKeyError();

  const adapter=hasKey?visionAdapter():demoAdapter();
  return adapter.extract(file);
}
