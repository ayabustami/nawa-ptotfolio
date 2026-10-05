import { capabilities } from '../../data/site';
import Reveal from '../Reveal';

export default function Capabilities() {
  return (
    <section id="capabilities" className="section">
      <div className="wrap">
        <h2 className="sec-title">Where software meets intelligence.</h2>
        <ul className="cells">
          {capabilities.map((c) => (
            <Reveal as="li" className="cell" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
