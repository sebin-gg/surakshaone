import {NextResponse} from "next/server";
import {extractClaim,ClaimIntakeError} from "../../../lib/claim-intake";

const noStore={"Cache-Control":"no-store"};

export async function POST(req:Request){
  try{
    const form=await req.formData();
    const file=form.get("screenshot");
    if(!(file instanceof File))
      return NextResponse.json({error:"No file uploaded."},{status:400,headers:noStore});

    const claim=await extractClaim(file);
    return NextResponse.json({claim},{headers:noStore});
  }catch(e){
    if(e instanceof ClaimIntakeError)
      return NextResponse.json({error:e.message},{status:e.status,headers:noStore});
    return NextResponse.json({error:"Could not analyze screenshot. Try again with clearer image."},{status:502,headers:noStore});
  }
}
