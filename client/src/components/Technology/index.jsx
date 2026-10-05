import { technology } from '../../data/site';
import Reveal from '../Reveal';

export default function Technology() {
  return (
    <section id="technology" className="section">
      <div className="wrap">
        <h2 className="sec-title">Technology</h2>
        <div className="tech">
          {technology.map((g) => (
            <Reveal className="tech-col" key={g.group}>
              <h3>{g.group}</h3>
              <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
