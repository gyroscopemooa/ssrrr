// A copied address must not be replaced by an HTML link's different destination.
export function isPlainUrlPaste(text:string){
 return /^https?:\/\/[^\s<>"']+$/.test(text.trim());
}
