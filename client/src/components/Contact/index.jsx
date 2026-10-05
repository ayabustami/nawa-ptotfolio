import { useState } from 'react';
import { API_URL } from '../../hooks/useApi';
import { contactDetails } from '../../data/site';
import Reveal from '../Reveal';

const empty = { name: '', email: '', company: '', message: '', website: '' };

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [state, setState] = useState({ status: 'idle', error: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'sending', error: '' });
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
      setForm(empty);
      setState({ status: 'sent', error: '' });
    } catch (err) {
      setState({ status: 'error', error: err.message || 'Could not send your message.' });
    }
  };

  return (
    <section id="contact" className="section">
      <Reveal className="wrap split">
        <div>
          <h2>Have an idea worth building?</h2>
          <p className="lede">Tell us what you’re working on and let’s explore how technology can help.</p>
          {contactDetails.email && <p><a className="link" href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a></p>}
        </div>
        <form onSubmit={submit} className="form" noValidate>
          <label>Name<input required value={form.name} onChange={set('name')} autoComplete="name" maxLength={120} /></label>
          <label>Email<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={200} /></label>
          <label>Company <small>(optional)</small><input value={form.company} onChange={set('company')} autoComplete="organization" maxLength={160} /></label>
          <label>What are you working on?<textarea required rows="5" value={form.message} onChange={set('message')} maxLength={4000} /></label>
          <input className="hp" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />
          <button className="btn btn-primary" disabled={state.status === 'sending'}>
            {state.status === 'sending' ? 'Sending…' : 'Start a Conversation'}
          </button>
          <p className="form-msg" role="status" aria-live="polite">
            {state.status === 'sent' && 'Message sent. Thank you.'}
            {state.status === 'error' && state.error}
          </p>
        </form>
      </Reveal>
    </section>
  );
}
