import { useEffect, useState } from 'react';
import { nav } from '../../data/site';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey); };
  }, []);

  const close = () => setOpen(false);
  return (
    <header className={`nav ${solid || open ? 'solid' : ''}`}>
      <div className="wrap nav-row">
        <a href="#top" className="wordmark" onClick={close} aria-label="NAWA Technology, back to top">NAWA</a>
        <nav aria-label="Primary" id="primary-nav" className={`nav-links ${open ? 'open' : ''}`}>
          {nav.map((n) => <a key={n.href} href={n.href} onClick={close}>{n.label}</a>)}
          <a href="#contact" className="btn btn-sm" onClick={close}>Start a Conversation</a>
        </nav>
        <button className="menu-btn" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
          <span className="sr">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden="true" className={`bars ${open ? 'x' : ''}`} />
        </button>
      </div>
    </header>
  );
}
