'use client';

import {useEffect} from 'react';

declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      showAds?: (...placements: unknown[]) => void;
      destroyPlaceholders?: (...ids: number[]) => void;
    };
  }
}

export default function EzoicAd() {
  useEffect(() => {
    window.ezstandalone = window.ezstandalone || {cmd: []};
    window.ezstandalone.cmd = window.ezstandalone.cmd || [];
    window.ezstandalone.cmd.push(() => window.ezstandalone?.showAds?.('.ezoicad'));
  }, []);

  return <div className="ezoicad" />;
}
