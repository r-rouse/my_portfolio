import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import bioMarkdown from '../../../BIO.md?raw';
import { aboutPlaceholders, paragraphsFromBioMarkdown } from '../../data/aboutContent';
import './About.css';

const bioParagraphs = paragraphsFromBioMarkdown(bioMarkdown);

export default function AboutPage() {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.replace('#', '');
    if (!id) return;

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <main className="about-page">
      <header className="about-page-header">
        <h1 className="about-page-title">About</h1>
        <p className="about-page-subtitle">Bio, hobbies, and a few favorites.</p>
      </header>

      <div className="about-page-content">
        <article id="bio" className="about-block">
          <h2 className="about-heading">Bio</h2>
          {bioParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="about-text">
              {paragraph}
            </p>
          ))}
        </article>

        <article id="hobbies" className="about-block">
          <h2 className="about-heading">{aboutPlaceholders.hobbies.title}</h2>
          <p className="about-text about-empty">{aboutPlaceholders.hobbies.emptyMessage}</p>
        </article>

        <article id="favorites" className="about-block">
          <h2 className="about-heading">{aboutPlaceholders.favorites.title}</h2>
          <p className="about-text about-empty">{aboutPlaceholders.favorites.emptyMessage}</p>
        </article>
      </div>
    </main>
  );
}
