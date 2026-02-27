import { useState } from 'react';
import { uploadCSV, simulateScenario } from '../services/api';
import { Upload, BarChart2, Play, CheckCircle, XCircle, FileSpreadsheet, TrendingUp, ShoppingCart } from 'lucide-react';

const DATA_TYPES = [
  {
    id: 'sales',
    label: 'Sales Data',
    icon: ShoppingCart,
    description: 'Historical sales records by product',
    color: 'indigo',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    borderHover: 'hover:border-indigo-300',
    bgHover: 'hover:bg-indigo-50/40',
  },
  {
    id: 'inventory',
    label: 'Inventory Data',
    icon: FileSpreadsheet,
    description: 'Stock levels and warehouse data',
    color: 'violet',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    borderHover: 'hover:border-violet-300',
    bgHover: 'hover:bg-violet-50/40',
  },
  {
    id: 'market_trends',
    label: 'Market Trends',
    icon: TrendingUp,
    description: 'External market trend signals',
    color: 'emerald',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    borderHover: 'hover:border-emerald-300',
    bgHover: 'hover:bg-emerald-50/40',
  },
];

export default function DataUpload() {
  const [uploading, setUploading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [uploadedType, setUploadedType] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, dataType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setUploadedType(dataType);

    try {
      const result = await uploadCSV(dataType, file);
      setUploadResult(result);
    } catch (error: any) {
      setUploadResult({ success: false, errors: [error.message] });
    } finally {
      setUploading(false);
    }
  };

  const handleSimulation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const scenarioData = {
      scenario_type: formData.get('scenario_type'),
      affected_products: (formData.get('affected_products') as string).split(',').map(p => p.trim()),
      time_horizon: parseInt(formData.get('time_horizon') as string),
      initial_conditions: {
        base_inventory: parseInt(formData.get('base_inventory') as string),
      },
      simulation_parameters: {
        demand_rate: parseInt(formData.get('demand_rate') as string),
        overstock_factor: parseFloat(formData.get('overstock_factor') as string) || 2.0,
        stockout_factor: parseFloat(formData.get('stockout_factor') as string) || 0.5,
      },
    };

    setSimulating(true);
    setSimulationResult(null);

    try {
      const result = await simulateScenario(scenarioData);
      setSimulationResult(result);
    } catch (error: any) {
      setSimulationResult({ success: false, error: error.message });
    } finally {
      setSimulating(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder:text-gray-300";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Upload & Simulation</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Upload retail data and run failure scenario simulations
        </p>
      </div>

      {/* Data Upload Section */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Upload Data</h3>
          <p className="text-xs text-gray-400 mt-0.5">Import CSV files to power your simulations</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DATA_TYPES.map((dt) => {
              const Icon = dt.icon;
              return (
                <label
                  key={dt.id}
                  className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer transition-all duration-200 ${dt.borderHover} ${dt.bgHover} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`w-14 h-14 ${dt.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className={`h-7 w-7 ${dt.iconColor}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{dt.label}</h4>
                  <p className="text-xs text-gray-400 mb-4">{dt.description}</p>
                  <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload CSV</span>
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, dt.id)}
                    disabled={uploading}
                  />
                </label>
              );
            })}
          </div>

          {uploadResult && (
            <div className={`mt-5 flex items-start space-x-3 p-4 rounded-xl border ${
              uploadResult.success
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-medium ${uploadResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                {uploadResult.success
                  ? `Successfully uploaded ${uploadResult.records_count} records from ${uploadedType?.replace('_', ' ')} file`
                  : `Upload failed: ${uploadResult.errors?.join(', ')}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Section */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
              <BarChart2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Run Simulation</h3>
              <p className="text-xs text-gray-400">Configure and execute a failure scenario</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSimulation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Scenario Type</label>
                <select name="scenario_type" className={inputClass} required>
                  <option value="OVERSTOCK">Overstock</option>
                  <option value="STOCKOUT">Stockout</option>
                  <option value="SEASONAL_MISMATCH">Seasonal Mismatch</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Time Horizon (days)</label>
                <input
                  type="number"
                  name="time_horizon"
                  defaultValue="30"
                  min="1"
                  max="365"
                  className={inputClass}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Affected Products <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input
                  type="text"
                  name="affected_products"
                  placeholder="PROD001, PROD002, PROD003"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Base Inventory</label>
                <input
                  type="number"
                  name="base_inventory"
                  defaultValue="1000"
                  min="0"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Demand Rate <span className="text-gray-400 font-normal">(units/day)</span></label>
                <input
                  type="number"
                  name="demand_rate"
                  defaultValue="50"
                  min="0"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Overstock Factor</label>
                <input
                  type="number"
                  name="overstock_factor"
                  defaultValue="2.0"
                  step="0.1"
                  min="1"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: simulating ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: simulating ? 'none' : '0 4px 14px rgba(79,70,229,0.35)' }}
            >
              <Play className="h-4 w-4" />
              <span>{simulating ? 'Running Simulation...' : 'Run Simulation'}</span>
            </button>
          </form>

          {simulationResult && (
            <div className={`mt-5 p-4 rounded-xl border ${
              simulationResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}>
              {simulationResult.success ? (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-800">Simulation completed successfully!</p>
                  </div>
                  <div className="space-y-1 text-sm text-emerald-700 font-mono text-xs pl-7">
                    <p>Scenario ID: {simulationResult.scenario_id}</p>
                    <p>Execution time: {simulationResult.simulation?.execution_time_seconds?.toFixed(2)}s</p>
                  </div>
                  <a
                    href={`/scenario/${simulationResult.scenario_id}`}
                    className="inline-flex items-center space-x-1.5 mt-3 ml-7 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <span>View detailed results</span>
                    <span>→</span>
                  </a>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm font-medium text-red-800">
                    Simulation failed: {simulationResult.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
