export function activeSubtitle(cues,frame,startFrame=0){
 const time=(frame+startFrame)/30;
 return (Array.isArray(cues)?cues:[]).find(c=>Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.end>c.start&&time>=c.start&&time<c.end)||null;
}
