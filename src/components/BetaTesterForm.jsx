import { useState } from 'react';
import emailjs from '@emailjs/browser';
import './BetaTesterForm.css';

function BetaTesterForm({ projectTitle }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EmailJS configuration
  // You'll need to replace these with your EmailJS credentials
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

    // Basic validation
    if (!formData.name || !formData.email) {
      setError('Please fill in at least your name and email.');
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    // Check if EmailJS is configured
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' || 
        EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || 
        EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      setError('Email service is not configured. Please contact the site owner.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare email template parameters
      // Note: Variable names must match exactly what's in your EmailJS template
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

      // Send email using EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('EmailJS success:', response);
      setSubmitted(true);
      setFormData({ name: '', email: '', company: '', role: '' });
      setIsSubmitting(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('EmailJS error details:', err);
      console.error('Error text:', err.text);
      console.error('Error status:', err.status);
      
      // Provide more specific error message
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

  if (submitted) {
    return (
      <div className="beta-form-success">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>Thank you! We'll send you TestFlight access soon.</p>
      </div>
    );
  }

  return (
    <form className="beta-tester-form" onSubmit={handleSubmit}>
      <h4 className="beta-form-title">Join as a Beta Tester</h4>
      <p className="beta-form-description">
        Interested in testing this app? Fill out the form below and we'll send you TestFlight access.
      </p>
      
      {error && <div className="beta-form-error">{error}</div>}
      
      <div className="beta-form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Your name"
        />
      </div>

      <div className="beta-form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your.email@example.com"
        />
      </div>

      <div className="beta-form-group">
        <label htmlFor="company">Company (Optional)</label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Company name"
        />
      </div>

      <div className="beta-form-group">
        <label htmlFor="role">Role (Optional)</label>
        <input
          type="text"
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          placeholder="e.g., Recruiter, Hiring Manager"
        />
      </div>

      <button type="submit" className="beta-form-submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Request Beta Access'}
      </button>
    </form>
  );
}

export default BetaTesterForm;

