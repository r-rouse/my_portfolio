import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Navigation from './components/Navigation'
import App from './App.jsx'
import AnalyticsPage from '../app/analytics/page'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
