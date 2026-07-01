/**
 * Portfolio-wide analytics initialization.
 *
 * Fires once per page load:
 *   - session_started (first visit in this browser tab)
 *   - page_view (every load / route change)
 *
 * Also observes section visibility for source_viewed events.
 */

import { useEffect } from 'react';
import { trackEvent } from '../../lib/analytics/trackEvent';
import { getSessionId, isNewSession, markSessionStarted } from '../../lib/analytics/session';

const SECTIONS = ['home', 'resume', 'projects'] as const;
const OBSERVED = new Set<string>();

export function usePortfolioAnalytics(): void {
  useEffect(() => {
    if (isNewSession()) {
      trackEvent('session_started', { sessionId: getSessionId() });
      markSessionStarted();
    }

    trackEvent('page_view', { section: 'home' });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.4) {
            continue;
          }

          const sectionId = entry.target.id;
          if (!sectionId || OBSERVED.has(sectionId)) {
            continue;
          }

          OBSERVED.add(sectionId);
          trackEvent('source_viewed', { section: sectionId });
        }
      },
      { threshold: 0.4 }
    );

    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);
}

/** Track navigation to a portfolio section via the nav bar. */
export function trackSectionNavigation(sectionId: string): void {
  trackEvent('source_viewed', { section: sectionId, via: 'navigation' });
}

/** Track external link clicks without storing URLs that may contain PII. */
export function trackExternalLink(label: string): void {
  trackEvent('external_link_clicked', { linkLabel: label });
}

/** Track resume download — no file content is sent to analytics. */
export function trackResumeDownload(): void {
  trackEvent('resume_downloaded');
}

/** Track project card interactions. */
export function trackProjectClick(projectId: number, projectTitle: string): void {
  trackEvent('project_clicked', { projectId, projectTitle });
}
