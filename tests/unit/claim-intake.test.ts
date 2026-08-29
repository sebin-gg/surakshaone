import{describe,it,expect,vi,afterEach,beforeEach}from"vitest";
import{claimSchema,extractClaim,demoAdapter,ClaimIntakeError,allowedImageTypes,MAX_IMAGE_BYTES}from"../../lib/claim-intake";

describe("claimSchema",()=>{
  it("accepts valid claim",()=>{
    const valid={utr:"123",payeeVpa:"a@b",amountInr:100,timestamp:"2024-01-01",fraudVector:"scam",summary:"text"};
    expect(claimSchema.parse(valid)).toEqual(valid);
  });
  it("rejects missing utr",()=>{
    expect(()=>claimSchema.parse({payeeVpa:"a@b",amountInr:100,timestamp:"",fraudVector:"",summary:""})).toThrow();
  });
  it("rejects non-number amountInr",()=>{
    expect(()=>claimSchema.parse({utr:"1",payeeVpa:"a@b",amountInr:"100",timestamp:"",fraudVector:"",summary:""})).toThrow();
  });
});

describe("constants",()=>{
  it("allowedImageTypes has 4 entries",()=>expect(allowedImageTypes).toHaveLength(4));
  it("MAX_IMAGE_BYTES is 8MB",()=>expect(MAX_IMAGE_BYTES).toBe(8*1024*1024));
});

describe("demoAdapter",()=>{
  it("returns valid claim with DEMO UTR",async()=>{
    const adapter=demoAdapter();
    const file=new File([""],"test.png",{type:"image/png"});
    const claim=await adapter.extract(file);
    expect(claim.utr).toBe("DEMO-4281908129");
    expect(claim.amountInr).toBe(15000);
  });
});

describe("extractClaim",()=>{
  const originalEnv=process.env;
  beforeEach(()=>{process.env={...originalEnv}});
  afterEach(()=>{process.env=originalEnv});

  it("rejects non-image MIME type",async()=>{
    process.env.DEMO_MODE="true";
    const file=new File([""],"doc.txt",{type:"text/plain"});
    await expect(extractClaim(file)).rejects.toThrow(ClaimIntakeError);
    await expect(extractClaim(file)).rejects.toMatchObject({status:400});
  });

  it("rejects file over 8MB",async()=>{
    process.env.DEMO_MODE="true";
    const big=new File([new ArrayBuffer(9*1024*1024)],"big.png",{type:"image/png"});
    await expect(extractClaim(big)).rejects.toMatchObject({status:413});
  });

  it("throws 503 when no key and no demo mode",async()=>{
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEMO_MODE;
    const file=new File([""],"test.png",{type:"image/png"});
    await expect(extractClaim(file)).rejects.toMatchObject({status:503});
  });

  it("uses demoAdapter when DEMO_MODE=true",async()=>{
    delete process.env.OPENAI_API_KEY;
    process.env.DEMO_MODE="true";
    const file=new File([""],"test.png",{type:"image/png"});
    const claim=await extractClaim(file);
    expect(claim.utr).toBe("DEMO-4281908129");
  });
});
