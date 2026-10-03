/** Display cleanup for both legacy notification emails and new excerpts. */
export function economyDisplay(raw: string) {
  const excerpt = /※ ChatGPT 알림 메일에 수신된 내용입니다|원문은 VIP 회원에게 제공됩니다/.test(raw);
  let text = raw.replace(/\r\n?/g, '\n');
  if (excerpt) {
    // HTML notifications include a hidden preheader followed by the same excerpt.
    const lastMarker = text.lastIndexOf('SSRRR_ECONOMY');
    if (lastMarker >= 0) text = text.slice(lastMarker);
    text = text.split(/\n\s*(?:※ ChatGPT 알림 메일|원문은 VIP 회원에게 제공됩니다|(?:View|Open|Read)(?: the)? message|Unsubscribe|수신거부)/i)[0];
  }
  text = text.replace(/^\s*SSRRR_ECONOMY\s*/, '');
  text = text.split('\n').map(line => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return {text, excerpt};
}
