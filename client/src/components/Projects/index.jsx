import { useApi } from '../../hooks/useApi';
import Reveal from '../Reveal';
import ProjectMedia from './ProjectMedia';

function Project({ p }) {
  const ai = p.features.filter((f) => f.isAi);
  const other = p.features.filter((f) => !f.isAi);
  return (
    <Reveal as="article" className={`project ${p.is_featured ? 'featured' : ''}`}>
      <ProjectMedia project={p} />
      <div className="project-body">
        {p.category && <p className="meta">{p.category}</p>}
        <h3>{p.title}</h3>
        {p.subtitle && <p className="subtitle">{p.subtitle}</p>}
        <p>{p.description}</p>
        {p.technologies.length > 0 && (
          <>
            <h4>Technologies</h4>
            <ul className="tags">{p.technologies.map((t) => <li key={t}>{t}</li>)}</ul>
          </>
        )}
        {ai.length > 0 && (
          <>
            <h4>AI features</h4>
            <ul className="tags accent">{ai.map((f) => <li key={f.label}>{f.label}</li>)}</ul>
          </>
        )}
        {other.length > 0 && (
          <>
            <h4>Features</h4>
            <ul className="tags">{other.map((f) => <li key={f.label}>{f.label}</li>)}</ul>
          </>
        )}
        {(p.projectUrl || p.githubUrl) && (
          <div className="project-links">
            {p.projectUrl && <a className="btn btn-sm" href={p.projectUrl} target="_blank" rel="noopener noreferrer">Visit {p.title}</a>}
            {p.githubUrl && <a className="btn btn-sm" href={p.githubUrl} target="_blank" rel="noopener noreferrer">View on GitHub</a>}
          </div>
        )}
      </div>
    </Reveal>
  );
}

export default function Projects() {
  const { status, data } = useApi('/api/projects');
  const projects = data?.projects ?? [];
  return (
    <section id="work" className="section">
      <div className="wrap">
        <h2 className="sec-title">Featured work</h2>
        {status === 'loading' && <p className="state" role="status">Loading projects…</p>}
        {status === 'error' && <p className="state" role="alert">Projects are unavailable right now. Please try again shortly.</p>}
        {status === 'ready' && projects.length === 0 && <p className="state">No projects have been published yet.</p>}
        {projects.map((p) => <Project key={p.id} p={p} />)}
      </div>
    </section>
  );
}
