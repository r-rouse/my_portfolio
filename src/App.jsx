import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProjectCard from './components/ProjectCard';
import { projectsData } from './data/projectsData';
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
              {projectsData.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;


