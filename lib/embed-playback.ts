// Request audible playback. Browser autoplay policy may still require a click.
export function embedPlaybackUrl(provider:'youtube'|'tiktok',videoId:string,autoplay=false){
 const id=encodeURIComponent(videoId);
 return provider==='youtube'
  ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay?1:0}&mute=0&controls=1`
  : `https://www.tiktok.com/player/v1/${id}?controls=1&description=1&music_info=1&autoplay=${autoplay?1:0}&muted=0`;
}
