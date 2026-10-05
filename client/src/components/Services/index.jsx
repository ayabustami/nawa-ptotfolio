import { services } from '../../data/site';
import Reveal from '../Reveal';

export default function Services() {
  return (
    <section id="services" className="section">
      <div className="wrap">
        <h2 className="sec-title">Services</h2>
        <ul className="rows">
          {services.map((s) => (
            <Reveal as="li" className="row" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
