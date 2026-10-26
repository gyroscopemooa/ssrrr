'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';

export default function EzoicRouteHandler() {
  const pathname = usePathname();
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    window.ezstandalone = window.ezstandalone || {cmd: []};
    window.ezstandalone.cmd = window.ezstandalone.cmd || [];
    window.ezstandalone.cmd.push(() => {
      window.ezstandalone?.destroyPlaceholders?.();
      requestAnimationFrame(() => window.ezstandalone?.showAds?.());
    });
  }, [pathname]);

  return null;
}
