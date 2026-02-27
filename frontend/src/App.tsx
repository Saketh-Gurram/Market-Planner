import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AnalystDashboard from './pages/AnalystDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import DataUpload from './pages/DataUpload';
import ScenarioDetails from './pages/ScenarioDetails';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<AnalystDashboard />} />
          <Route path="/executive" element={<ExecutiveDashboard />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/scenario/:id" element={<ScenarioDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
