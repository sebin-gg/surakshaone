import {NextResponse} from "next/server";
import type{NextRequest} from "next/server";
import {contentSecurityPolicy,shouldExcludeFromCSP} from "./lib/platform-policy";

export function middleware(request:NextRequest){
  if(shouldExcludeFromCSP(request.nextUrl.pathname))
    return NextResponse.next();

  const response=NextResponse.next();
  response.headers.set("Content-Security-Policy",contentSecurityPolicy);
  return response;
}

export const config={matcher:"/((?!_next|api).*)"};
