"use client";
import { useEffect, useRef, useState } from "react";
const units = {
  desktop: {key:"2e3a5faf8c6edf1753662e05ac33be42",width:728,height:90},
  mobile: {key:"87b8ac1ab4ac6361518146e7501eff67",width:320,height:50},
  article: {key:"0b7e3cc62f2a2f11ea23b0a8f7377f4b",width:300,height:250},
  sidebar: {key:"cba4b97a0400957531590184be0e754a",width:160,height:600},
  left: {key:"e75b43829a4d9c36b535bcdc452b47ff",width:160,height:300},
};
type Position = "top" | "bottom" | "article" | "sidebar" | "left";
const labels = {top:"상단",bottom:"하단",article:"본문 하단",sidebar:"오른쪽 사이드바",left:"왼쪽 사이드바"};
export function BannerAd({ position }: { position: Position }) {
  const host = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  const [viewport, setViewport] = useState(0);
  useEffect(() => {
    const update = () => { setWidth(host.current?.clientWidth || 0); setViewport(window.innerWidth); };
    const observer = new ResizeObserver(update);
    if (host.current) observer.observe(host.current);
    update(); window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, []);
  const unit = position === "left" ? units.left : position === "article" ? units.article : position === "sidebar" ? units.sidebar : width >= 728 ? units.desktop : units.mobile;
  const visible = width >= unit.width && (position !== "sidebar" || viewport > 1100) && (position !== "left" || viewport > 700);
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:${unit.width}px;height:${unit.height}px;overflow:hidden}</style></head><body><script>atOptions=${JSON.stringify({...unit,format:"iframe",params:{}})};</script><script src="https://bicea.org/22/${unit.key}"></script></body></html>`;
  return <section ref={host} className="site-banner-ad" data-ad-position={position} aria-label={`${labels[position]} 광고`}>
    {visible && <><span>광고</span><iframe key={unit.key} title={`${labels[position]} 배너 광고`} width={unit.width} height={unit.height} scrolling="no" srcDoc={doc}/></>}
  </section>;
}
