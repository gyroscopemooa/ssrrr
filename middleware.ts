import {NextRequest,NextResponse} from 'next/server';
export function middleware(req:NextRequest){
 if(req.nextUrl.hostname==='www.ssrrr.net'){
  const target=req.nextUrl.clone();target.hostname='ssrrr.net';target.protocol='https:';target.port='';
  return NextResponse.redirect(target,308);
 }
 return NextResponse.next();
}
