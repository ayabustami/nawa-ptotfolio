import { useRef } from 'react';

// Renders real media from the database. If a project has none, it renders a neutral
// PLACEHOLDER frame (no fake screenshots). Add rows to project_media to replace it.
export default function ProjectMedia({ project }) {
  const ref = useRef(null);
  const media = project.media[0];
  const move = (e) => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height - 0.5) * 10}px`);
  };
  const reset = () => { ref.current?.style.setProperty('--mx', '0px'); ref.current?.style.setProperty('--my', '0px'); };
  return (
    <div className="media" ref={ref} onMouseMove={move} onMouseLeave={reset} data-placeholder={media ? undefined : 'true'}>
      {media ? (
        <img src={media.url} alt={media.alt} loading="lazy" />
      ) : (
        <div className="media-empty" aria-hidden="true"><span>{project.title}</span></div>
      )}
    </div>
  );
}
