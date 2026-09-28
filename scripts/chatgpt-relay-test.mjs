import {chatGptRelayStatus,markerDetails,readTaskMessage} from '../worker/chatgpt.mjs';
const url=process.argv.find(value=>value.startsWith('https://'));
if(!url){console.log(JSON.stringify({status:await chatGptRelayStatus(),marker:await markerDetails()}));process.exit(0)}
const body=await readTaskMessage(url,{headless:!process.argv.includes('--headed')});
console.log(JSON.stringify({status:'ok',firstLine:body.split('\n',1)[0],characters:body.length,preview:body.slice(0,160)}));
