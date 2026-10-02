import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {z} from 'zod';
import {getChatGPTUser,type ChatGPTUser} from '@/app/chatgpt-auth';
import {submitEconomyReport} from '@/lib/automation/mail';
import {isAdmin} from '@/lib/settings';

export const dynamic='force-dynamic';

const submitInput={
 title:z.string().trim().min(1).max(120).describe('사이트에 표시할 경제 알림 제목'),
 body:z.string().trim().min(1).max(30000).describe('첫 줄이 정확히 SSRRR_ECONOMY인 전체 알림 원문'),
 idempotencyKey:z.string().min(8).max(200).regex(/^[A-Za-z0-9._:-]+$/).optional().describe('같은 알림의 중복 등록을 막는 안정적인 키'),
};
const submitOutput={accepted:z.boolean(),published:z.boolean(),status:z.string(),duplicate:z.boolean(),privacy_reasons:z.array(z.string()),id:z.string().optional()};

function serverFor(user:ChatGPTUser){
 const server=new McpServer({name:'SSRRR 경제 원고 전송',version:'1.0.0'},{instructions:'실제 경제 알림이 생성된 경우에만 submit_economy_report를 한 번 호출하세요. 알림이 없는 실행에서는 호출하지 마세요. 전송된 원고는 원문 그대로 경제 게시판에 즉시 게시되며, 민감 개인정보가 감지된 경우에만 보류됩니다.'});
 server.registerTool('get_profile',{
  title:'SSRRR 연결 계정 확인',
  description:'현재 SSRRR 사이트에 연결된 관리자 계정을 확인합니다.',
  outputSchema:{id:z.string(),name:z.string(),email:z.string(),nickname:z.string()},
  annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},
  _meta:{'openai/profile':true},
 },async()=>({
  content:[{type:'text',text:`${user.displayName} (${user.email})`}],
  structuredContent:{id:user.userId,name:user.displayName,email:user.email,nickname:user.displayName},
 }));
 server.registerTool('submit_economy_report',{
  title:'SSRRR 경제 게시판 즉시 게시',
  description:'완성된 SSRRR_ECONOMY 경제 알림의 제목과 전체 본문을 원문 그대로 SSRRR 경제 게시판에 즉시 게시합니다. 주민등록번호, 개인 휴대폰번호, 개인 이메일, 계좌번호, 비밀번호/API 키/토큰 같은 민감 개인정보가 있을 때만 게시를 보류하고 blocked_privacy로 알립니다. 기업명, 종목, 주가, 큰 숫자, 정책, 기관명, 링크는 차단하지 않습니다. 실제 알림이 없으면 호출하지 않습니다.',
  inputSchema:submitInput,
  outputSchema:submitOutput,
  annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false},
 },async({title,body,idempotencyKey})=>{
  const r=await submitEconomyReport({title,body,idempotencyKey,mode:'publish'},'mcp');
  const text=r.status==='published'?'경제 원고 전체를 원문 그대로 경제 게시판에 게시했습니다.':r.status==='duplicate'?'이미 같은 경제 원고가 있어 중복 게시하지 않았습니다.':r.status==='blocked_privacy'?'민감 개인정보('+r.privacy_reasons.join(', ')+')가 감지되어 게시하지 않고 관리자 검토 대기에 저장했습니다.':r.status==='rejected_format'?'전송하지 않았습니다. 본문 첫 줄은 정확히 SSRRR_ECONOMY여야 합니다.':'게시하지 못했습니다. ('+r.status+')';
  return {isError:!r.accepted,content:[{type:'text',text}],structuredContent:{accepted:r.accepted,published:r.published,status:r.status,duplicate:r.duplicate,privacy_reasons:r.privacy_reasons,...(r.id?{id:r.id}:{})}};
 });
 return server;
}

async function handle(req:Request){
 const user=await getChatGPTUser();
 if(!user||!isAdmin(user))return Response.json({error:'SSRRR 관리자 연결이 필요합니다.'},{status:user?403:401,headers:{'Cache-Control':'no-store'}});
 const transport=new WebStandardStreamableHTTPServerTransport({enableJsonResponse:true,maxRequestBodySize:160000});
 const server=serverFor(user);
 await server.connect(transport);
 return transport.handleRequest(req);
}

export const POST=handle;
export const GET=handle;
export const DELETE=handle;
export function OPTIONS(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID','Access-Control-Expose-Headers':'MCP-Session-Id','Access-Control-Max-Age':'86400'}})}
