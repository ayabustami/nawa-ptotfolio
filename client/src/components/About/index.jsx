import { about } from '../../data/site';
import Reveal from '../Reveal';

export default function About() {
  return (
    <section id="about" className="section">
      <Reveal className="wrap split">
        <h2>Technology with purpose.</h2>
        <div className="prose">{about.map((p) => <p key={p}>{p}</p>)}</div>
      </Reveal>
    </section>
  );
}
