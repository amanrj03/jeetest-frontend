import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TestCreator from './pages/TestCreator';
import StudentPanel from './pages/StudentPanel';
import TestWindow from './pages/TestWindow';
import InstructionPage from './pages/InstructionPage';
import AnalysePage from './pages/AnalysePage';
import PreviewTest from './pages/PreviewTest';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <Routes>
          <Route path="/create/test" element={<TestCreator />} />
          <Route path="/student" element={<StudentPanel />} />
          <Route path="/instructions/:testId" element={<InstructionPage />} />
          <Route path="/test/:attemptId" element={<TestWindow />} />
          <Route path="/analyse/:attemptId" element={<AnalysePage />} />
          <Route path="/preview/:testId" element={<PreviewTest />} />
          <Route path="/" element={<StudentPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;