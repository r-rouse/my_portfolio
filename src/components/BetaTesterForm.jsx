import { useId, useState } from 'react';
import emailjs from '@emailjs/browser';
import './BetaTesterForm.css';

function BetaTesterForm({ projectTitle }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const EMAILJS_SERVICE_ID = 'service_udga989';
  const EMAILJS_TEMPLATE_ID = 'template_oz7r5hk';
  const EMAILJS_PUBLIC_KEY = 'hPQMKbUfaX7z2aBSi';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.name || !formData.email) {
      setError('Please fill in at least your name and email.');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (
      EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' ||
      EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' ||
      EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'
    ) {
      setError('Email service is not configured. Please contact the site owner.');
      setIsSubmitting(false);
      return;
    }

    try {
      const templateParams = {
        to_email: 'randall.g.rouse@gmail.com',
        to_name: 'Randall Rouse',
        from_name: formData.name,
        from_email: formData.email,
        company: formData.company || 'Not provided',
        role: formData.role || 'Not provided',
        project: projectTitle,
        message: `New beta tester signup for ${projectTitle}`,
        reply_to: formData.email
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      setSubmitted(true);
      setFormData({ name: '', email: '', company: '', role: '' });
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
      }, 5000);
    } catch (err) {
      let errorMessage = 'Failed to send. Please try again.';
      if (err.text) {
        errorMessage = `Error: ${err.text}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`beta-tester ${open ? 'beta-tester-open' : ''}`}>
      <button
        type="button"
        className="beta-tester-toggle"
        aria-expanded={open}
        aria-controls={formId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Request TestFlight access</span>
        <span className="beta-tester-caret" aria-hidden="true" />
      </button>

      {open && (
        <div id={formId} className="beta-tester-panel">
          {submitted ? (
            <div className="beta-form-success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>Thank you! We'll send you TestFlight access soon.</p>
            </div>
          ) : (
            <form className="beta-tester-form" onSubmit={handleSubmit}>
              <p className="beta-form-description">
                Interested in testing this app? Leave your details and we’ll send TestFlight access.
              </p>

              {error && <div className="beta-form-error">{error}</div>}

              <div className="beta-form-group">
                <label htmlFor={`${formId}-name`}>Name *</label>
                <input
                  type="text"
                  id={`${formId}-name`}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="beta-form-group">
                <label htmlFor={`${formId}-email`}>Email *</label>
                <input
                  type="email"
                  id={`${formId}-email`}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="beta-form-row">
                <div className="beta-form-group">
                  <label htmlFor={`${formId}-company`}>Company</label>
                  <input
                    type="text"
                    id={`${formId}-company`}
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="beta-form-group">
                  <label htmlFor={`${formId}-role`}>Role</label>
                  <input
                    type="text"
                    id={`${formId}-role`}
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <button type="submit" className="beta-form-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Request Beta Access'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default BetaTesterForm;
