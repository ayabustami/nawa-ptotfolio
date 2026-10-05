import HeroVisual from './HeroVisual';

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="caps">SOFTWARE · AI · DIGITAL PRODUCTS</p>
          <h1>Technology built around your business.</h1>
          <p className="lede">NAWA Technology builds software and AI-powered digital solutions designed around real business needs.</p>
          <div className="actions">
            <a className="btn btn-primary" href="#work">Explore Our Work</a>
            <a className="btn" href="#contact">Start a Conversation</a>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
