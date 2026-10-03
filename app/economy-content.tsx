import {LockKeyhole} from 'lucide-react';
import {economyDisplay} from '@/lib/economy-display';

export function EconomyContent({text}:{text:string}) {
  const content = economyDisplay(text);
  return <>{content.text.split(/\n{2,}/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
    {content.excerpt && <aside className="economy-vip-card" aria-label="VIP 원문 안내">
      <span className="economy-vip-icon"><LockKeyhole size={20} aria-hidden="true"/></span>
      <div><span className="economy-vip-label">VIP MEMBERS</span><strong>원문은 VIP 회원에게 제공됩니다</strong></div>
    </aside>}
  </>;
}
