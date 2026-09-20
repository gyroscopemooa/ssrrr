import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function GET(){const u=await getChatGPTUser();return Response.json({signedIn:!!u},{headers:{'Cache-Control':'no-store'}})}
