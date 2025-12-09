import './Navigation.css';

function Navigation() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => scrollToSection('home')}>
          Randall Rouse
        </div>
        <div className="nav-links">
          <button onClick={() => scrollToSection('resume')}>Resume</button>
          <button onClick={() => scrollToSection('projects')}>Projects</button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

