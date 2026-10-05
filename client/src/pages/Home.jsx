import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import Capabilities from '../components/Capabilities';
import Projects from '../components/Projects';
import Technology from '../components/Technology';
import Process from '../components/Process';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <About />
        <Services />
        <Capabilities />
        <Projects />
        <Technology />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
