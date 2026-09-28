import {openManualLogin} from '../worker/chatgpt.mjs';
console.log('전용 Edge 창에서 ChatGPT에 직접 로그인하세요. 비밀번호 입력은 자동화하지 않습니다.');
const result=await openManualLogin();
console.log(JSON.stringify({status:'ChatGPT 로그인 확인 완료',profile:result.profile}));
