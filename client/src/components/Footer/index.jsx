import { contactDetails } from '../../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot-row">
        <p>
          <strong>NAWA Technology</strong>
          <br />
          <span className="muted">
            Software &amp; AI Solutions
          </span>
        </p>

        <p className="muted">
          {contactDetails.linkedin && (
            <>
              <a
                href={contactDetails.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              {' · '}
            </>
          )}

          Nablus, Palestine
          <br />
          +972598092451
          <br />
          nawa.tech@hotmail.com
        </p>
      </div>
    </footer>
  );
}