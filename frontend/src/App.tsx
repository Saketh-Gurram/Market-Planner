import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AnalystDashboard from './pages/AnalystDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import DataUpload from './pages/DataUpload';
import ScenarioDetails from './pages/ScenarioDetails';
import StoreTransfer from './pages/StoreTransfer';
import FleetDashboard from './pages/FleetDashboard';
import StoreDashboard from './pages/StoreDashboard';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<AnalystDashboard />} />
          <Route path="/executive" element={<ExecutiveDashboard />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/scenario/:id" element={<ScenarioDetails />} />
          <Route path="/transfers" element={<StoreTransfer />} />
          <Route path="/dashboard" element={<FleetDashboard />} />
          <Route path="/store/:storeId" element={<StoreDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
