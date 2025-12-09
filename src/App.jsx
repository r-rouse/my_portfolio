import Navigation from './components/Navigation';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navigation />
      
      <main className="main-content">
        {/* Home Section */}
        <section id="home" className="section home-section">
          <div className="container">
            <h1 className="hero-title">Front End Developer</h1>
            <p className="hero-subtitle">
              Crafting beautiful and functional user experiences
            </p>
          </div>
        </section>

        {/* Resume Section */}
        <section id="resume" className="section resume-section">
          <div className="container">
            <h2 className="section-title">Resume</h2>
            <div className="resume-content">
              <div className="resume-card">
                <div className="resume-header">
                  <h1 className="resume-name">RANDALL ROUSE</h1>
                  <div className="resume-contact">
                    <p>San Jose, CA</p>
                    <p>|</p>
                    <p>(720) 930-1314</p>
                    <p>|</p>
                    <a href="mailto:Randall.G.Rouse@gmail.com">Randall.G.Rouse@gmail.com</a>
                    <p>|</p>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  </div>
                </div>

                <div className="resume-section-item">
                  <h3 className="resume-section-heading">SUMMARY</h3>
                  <p className="resume-text">
                    Full-stack developer specializing in React Native mobile development. Experienced in building and deploying high-performance, data-driven applications. Skilled in modern DevOps and Agile practices, with experience mentoring developers and coordinating project initiatives. Passionate about generative AI, automation, and emerging technologies that redefine how users and software interact.
                  </p>
                </div>

                <div className="resume-section-item">
                  <h3 className="resume-section-heading">TECHNICAL SKILLS</h3>
                  <div className="skills-grid">
                    <div className="skill-category">
                      <strong>Languages:</strong> JavaScript (ES6+), TypeScript, HTML5, CSS3, Python, SQL
                    </div>
                    <div className="skill-category">
                      <strong>Frameworks & Libraries:</strong> React Native, React, Node.js, Express, MobX, Jest, React Testing Library
                    </div>
                    <div className="skill-category">
                      <strong>AI & Emerging Tech:</strong> LLMs, Cursor, Crew.ai, Prompt Engineering
                    </div>
                    <div className="skill-category">
                      <strong>DevOps & Tools:</strong> Git, GitHub, Docker, Kubernetes, Jenkins, Xcode, Android Studio
                    </div>
                    <div className="skill-category">
                      <strong>Analytics & Instrumentation:</strong> Segment, Amplitude, Firebase Analytics
                    </div>
                    <div className="skill-category">
                      <strong>Security:</strong> CVE assessment and remediation, dependency vulnerability management
                    </div>
                    <div className="skill-category">
                      <strong>Other:</strong> RESTful APIs, Agile/Scrum, CI/CD pipelines, WebView integration, App Store deployment
                    </div>
                  </div>
                </div>

                <div className="resume-section-item">
                  <h3 className="resume-section-heading">EXPERIENCE</h3>
                  <div className="experience-item">
                    <div className="experience-header">
                      <div>
                        <h4 className="experience-title">Frontend Software Engineer</h4>
                        <p className="experience-company">IBM - Cognos Analytics Mobile</p>
                      </div>
                      <p className="experience-location">San Jose, CA</p>
                    </div>
                    <p className="experience-dates">Feb 2022 - Present</p>
                    <ul className="experience-list">
                      <li>Led mobile app development using React Native and MobX, driving major feature rollouts and app refactors.</li>
                      <li>Managed app builds and deployments to the Apple App Store/GooglePlay Store, ensuring compliance with security and review standards.</li>
                      <li>Instrumented analytics with Segment and Amplitude to track user behavior and improve UX insights.</li>
                      <li>Served as SME for CVE management, assessing and remediating security vulnerabilities.</li>
                      <li>Contributed to CI/CD infrastructure using Docker and Kubernetes, improving build reliability.</li>
                      <li>Mentored junior developers, conducted pull-request reviews, and established React Native best practices.</li>
                      <li>Created and managed Agile epics and user stories, coordinating deliverables across teams.</li>
                    </ul>
                  </div>
                  <div className="experience-item">
                    <div className="experience-header">
                      <div>
                        <h4 className="experience-title">Software Engineering Apprentice</h4>
                        <p className="experience-company">IBM</p>
                      </div>
                    </div>
                    <p className="experience-dates">Jan 2022 – Aug 2022</p>
                    <ul className="experience-list">
                      <li>Completed a U.S. Department of Labor-certified apprenticeship, contributing production-ready code to IBM projects.</li>
                      <li>Gained hands-on experience in full-stack JavaScript development, pair programming, and peer reviews.</li>
                    </ul>
                  </div>
                  <div className="experience-item">
                    <div className="experience-header">
                      <div>
                        <h4 className="experience-title">Wildland Firefighter</h4>
                        <p className="experience-company">United States Fish & Wildlife Service</p>
                      </div>
                      <p className="experience-location">Denver, CO</p>
                    </div>
                    <p className="experience-dates">Mar 2021 – Nov 2021</p>
                    <ul className="experience-list">
                      <li>Operated in high-stress environments, demonstrating strong teamwork, coordination, and adaptability.</li>
                    </ul>
                  </div>
                </div>

                <div className="resume-section-item">
                  <h3 className="resume-section-heading">EDUCATION & CERTIFICATIONS</h3>
                  <div className="education-list">
                    <div className="education-item">
                      <strong>Software Engineering Apprenticeship</strong> - IBM - U.S. Department of Labor Certified (2022)
                    </div>
                    <div className="education-item">
                      <strong>Software Engineering Immersive</strong> - General Assembly (2022)
                    </div>
                    <div className="education-item">
                      <strong>B.A. in Biology</strong> - Metropolitan State University of Denver (2019)
                    </div>
                  </div>
                </div>

                <div className="resume-section-item">
                  <h3 className="resume-section-heading">VOLUNTEER EXPERIENCE</h3>
                  <div className="experience-item">
                    <div className="experience-header">
                      <div>
                        <h4 className="experience-title">Field Technician</h4>
                        <p className="experience-company">Filidae Conservation Fund</p>
                      </div>
                      <p className="experience-location">San Francisco Bay Area</p>
                    </div>
                    <p className="experience-dates">2025 – Present</p>
                    <p className="resume-text">
                      Support wildlife biologists in field data collection and GPS tracking of mountain lion movements and habitat use.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="section projects-section">
          <div className="container">
            <h2 className="section-title">Projects</h2>
            <div className="projects-grid">
              <div className="project-card project-card-embed">
                <div className="project-header">
                  <h3 className="project-title">Tax Receipt Generator</h3>
                  <a
                    href="https://taxreceipt.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    Open live site
                  </a>
                </div>
                <p className="project-description">
                  An interactive tool that shows how federal tax dollars are allocated
                  based on salary, state, and tax year selections.
                </p>
                <div className="project-embed">
                  <iframe
                    title="Tax Receipt Generator"
                    src="https://taxreceipt.netlify.app/"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
                <div className="project-tags">
                  <span className="tag">React</span>
                  <span className="tag">Data Viz</span>
                  <span className="tag">UI</span>
                </div>
              </div>
              <div className="project-card project-card-embed">
                <div className="project-header">
                  <h3 className="project-title">Whole Food Calories</h3>
                  <a
                    href="https://wholefoodcalories.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    Open live site
                  </a>
                </div>
                <p className="project-description">
                  A comprehensive nutrition tool for tracking calories and nutritional information
                  for whole foods, helping users make informed dietary choices.
                </p>
                <div className="project-embed">
                  <iframe
                    title="Whole Food Calories"
                    src="https://wholefoodcalories.com/"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
                <div className="project-tags">
                  <span className="tag">React</span>
                  <span className="tag">Nutrition</span>
                  <span className="tag">Data</span>
                </div>
              </div>
              <div className="project-card project-card-embed">
                <div className="project-header">
                  <h3 className="project-title">Retail Scraper</h3>
                  <a
                    href="https://retailscraper.streamlit.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    Open live site
                  </a>
                </div>
                <p className="project-description">
                  A web scraping tool for retail data analysis, enabling users to extract and analyze
                  product information from various retail websites efficiently.
                </p>
                <a
                  href="https://retailscraper.streamlit.app/"
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
                      <p>Click to view Retail Scraper</p>
                      <span className="embed-placeholder-subtitle">Opens in new tab</span>
                    </div>
                  </div>
                </a>
                <div className="project-tags">
                  <span className="tag">Streamlit</span>
                  <span className="tag">Python</span>
                  <span className="tag">Web Scraping</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;


