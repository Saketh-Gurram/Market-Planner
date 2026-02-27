import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RiskAssessment {
  id: string;
  product_category: string;
  risk_score: number;
  risk_type: string;
  confidence_level: number;
  detection_timestamp: string;
  contributing_factors?: string[];
  historical_comparison?: Record<string, number>;
}

export interface FailureScenario {
  scenario_id: string;
  scenario_type: string;
  affected_products: string[];
  time_horizon: number;
  initial_conditions?: Record<string, any>;
  simulation_parameters?: Record<string, number>;
  created_timestamp: string;
}

export interface SimulationResult {
  result_id: string;
  scenario_id: string;
  simulation_data: any;
  inventory_levels?: Record<string, number[]>;
  stockout_probabilities?: Record<string, number>;
  overstock_costs?: Record<string, number>;
  execution_time_seconds?: number;
  simulation_timestamp: string;
}

export interface PropagationScore {
  id: string;
  scenario_id: string;
  overall_score: number;
  function_impacts: Record<string, number>;
  cascade_depth: number;
  affected_business_units?: string[];
  calculation_timestamp: string;
  confidence_metrics?: Record<string, number>;
}

export interface ExecutiveSummary {
  summary_id: string;
  scenario_id: string;
  revenue_risk: string;
  market_reason: string;
  urgency_level: string;
  recommended_actions?: string[];
  trade_offs?: Record<string, string>;
  generated_timestamp: string;
}

export interface MitigationStrategy {
  strategy_id: string;
  scenario_id: string;
  strategy_name: string;
  description: string;
  effectiveness_score: number;
  implementation_complexity: string;
  resource_requirements?: Record<string, any>;
  timeline_days: number;
  cost_estimate?: number;
  trade_offs?: string[];
}

// Data Ingestion
export const uploadCSV = async (dataType: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/api/data/upload/csv/${dataType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadJSON = async (dataType: string, data: any) => {
  const response = await api.post(`/api/data/upload/json/${dataType}`, data);
  return response.data;
};

// Risk Analysis
export const analyzeRisks = async (marketData: any) => {
  const response = await api.post('/api/analysis/risk/analyze', marketData);
  return response.data;
};

export const getRisks = async (): Promise<RiskAssessment[]> => {
  const response = await api.get('/api/analysis/risks');
  return response.data;
};

// Scenario Simulation
export const simulateScenario = async (scenarioData: any) => {
  const response = await api.post('/api/analysis/simulate', scenarioData);
  return response.data;
};

export const getScenarios = async (): Promise<FailureScenario[]> => {
  const response = await api.get('/api/analysis/scenarios');
  return response.data;
};

export const getScenarioDetails = async (scenarioId: string) => {
  const response = await api.get(`/api/analysis/scenarios/${scenarioId}`);
  return response.data;
};

export default api;
