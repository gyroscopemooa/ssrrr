// Email notifications are intentionally accepted as excerpts (owner opt-in).
// The receiving API still performs its normal privacy and duplicate checks.
export function notificationPayload(message, config) {
  if (!config.gmailEnabled || config.paused) throw Error('MAIL_DELIVERY_DISABLED');
  if (message.mailbox.toLowerCase() !== config.gmailMailbox.toLowerCase()) throw Error('MAILBOX_MISMATCH');
  if (!config.gmailSenders.some(x => x.toLowerCase() === message.sender.toLowerCase()) ||
      !config.gmailSubjects.some(x => message.subject.toLowerCase().includes(x.toLowerCase())) ||
      !message.labels.includes(config.gmailLabel)) throw Error('MAIL_FILTER_MISMATCH');
  const match = /^\s*\[Task Update\]\s*([^:\r\n]+)(?::\s*(.+))?$/i.exec(message.subject);
  if (!match) throw Error('NOT_TASK_NOTIFICATION');
  let body = message.body.replace(/\r\n?/g, '\n');
  // Keep only notification text, never publish private action/tracking links.
  body = body.split(/\n\s*(?:(?:View|Open|Read)(?: the)? message|메시지 보기|Unsubscribe|수신거부)\b/i)[0];
  const marker = body.lastIndexOf('SSRRR_ECONOMY');
  if (marker < 0) throw Error('ECONOMY_MARKER_MISSING');
  body = body.slice(marker).trim().replace(/^SSRRR_ECONOMY\s*/, 'SSRRR_ECONOMY\n');
  body = body.split(/\n\s*OpenAI\s*\n/i)[0].trim();
  body = body.split('\n').map(line => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (body.length < 30) throw Error('EMPTY_NOTIFICATION');
  const headline = body.replace(/^SSRRR_ECONOMY\s*/i, '').match(/(?:^|\s)[—–-]\s*([^\n]{8,})/)?.[1]?.trim();
  const title = (match[2]?.trim() || headline || match[1].trim()).replace(/\s+/g, ' ').slice(0, 120);
  return {idempotencyKey: 'gmail-' + message.providerId, title,
    body: body.slice(0, 29000) + '\n\n원문은 VIP 회원에게 제공됩니다',
    mode: 'publish', receivedAt: message.receivedAt};
}

export async function deliverNotification(message, config, request) {
  try {
  const payload = notificationPayload(message, config);
  const response = await request('/api/ingest/economy', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  });
  const result = await response.json();
  console.log(JSON.stringify({kind:'gmail-delivery',providerId:message.providerId,status:result.status,
    duplicate:result.duplicate===true,id:result.post_id||result.id}));
  return result.published === true ? {...result, status:'published'} : result;
  } catch (error) {
    console.error(JSON.stringify({kind:'gmail-delivery',providerId:message.providerId,error:String(error.message).slice(0,200)}));
    throw error;
  }
}
