import { contactDetails } from '../../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot-row">
        <p><strong>NAWA Technology</strong><br /><span className="muted">Software &amp; AI Solutions</span></p>
        <p className="muted">
          {contactDetails.linkedin && <><a href={contactDetails.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>{' · '}</>}
          © NAWA Technology
        </p>
      </div>
    </footer>
  );
}
