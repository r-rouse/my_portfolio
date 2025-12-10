import './ProjectCard.css';

function ProjectCard({ project }) {
  return (
    <div className="project-card project-card-embed">
      <div className="project-header">
        <h3 className="project-title">{project.title}</h3>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="project-link"
        >
          Open live site
        </a>
      </div>
      <p className="project-description">
        {project.description}
      </p>
      {project.hasIframe ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="project-embed-link"
        >
          <div className="project-embed">
            <iframe
              title={project.title}
              src={project.url}
              loading="lazy"
              allowFullScreen
            />
          </div>
        </a>
      ) : (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="project-preview-link"
        >
          <div className="project-embed project-embed-placeholder">
            <div className="embed-placeholder-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
              <p>Click to view {project.title}</p>
              <span className="embed-placeholder-subtitle">Opens in new tab</span>
            </div>
          </div>
        </a>
      )}
      <div className="project-tags">
        {project.tags.map((tag, index) => (
          <span key={index} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}

export default ProjectCard;

