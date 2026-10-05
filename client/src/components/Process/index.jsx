import { process } from '../../data/site';
import Reveal from '../Reveal';

export default function Process() {
  return (
    <section id="process" className="section">
      <div className="wrap">
        <h2 className="sec-title">From idea to product.</h2>
        <ol className="steps">
          {process.map((s, i) => (
            <Reveal as="li" className="step" key={s.title}>
              <span className="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
