import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import UpworkProposalGenerator from './features/Upworkproposalgenerator'
import ResumeAnalyzer from './features/Resumeanalyzer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/proposal-generator" replace />} />
        <Route path="/proposal-generator" element={<UpworkProposalGenerator />} />
        <Route path="/resume-alyzer" element={<ResumeAnalyzer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App