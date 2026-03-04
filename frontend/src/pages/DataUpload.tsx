import { useState, useEffect, useCallback } from 'react';
import { uploadCSV, simulateScenario } from '../services/api';
import {
  Upload, BarChart2, Play, CheckCircle, XCircle,
  FileSpreadsheet, TrendingUp, ShoppingCart, FileText,
  Trash2, Clock, Database, Eye, X, AlertCircle,
} from 'lucide-react';

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
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-600',
    badgeRing: 'ring-indigo-200',
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
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-600',
    badgeRing: 'ring-violet-200',
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
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    badgeRing: 'ring-emerald-200',
  },
];

const PREVIEW_LIMIT = 100;

interface UploadRecord {
  id: number;
  fileName: string;
  dataType: string;
  label: string;
  recordsCount: number;
  format: string;
  uploadedAt: string;
  preview: any[]; // up to PREVIEW_LIMIT rows stored for the modal
}

const STORAGE_KEY = 'retail_risk_upload_history';

function loadHistory(): UploadRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history: UploadRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' && value.includes('T00:00:00')) {
    // ISO date → strip time part for cleaner display
    return value.split('T')[0];
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
  return String(value);
}

// ─── File Preview Modal ───────────────────────────────────────────────────────
interface FilePreviewModalProps {
  record: UploadRecord;
  onClose: () => void;
}

function FilePreviewModal({ record, onClose }: FilePreviewModalProps) {
  const dtMeta = DATA_TYPES.find(d => d.id === record.dataType);
  const Icon = dtMeta?.icon ?? FileText;
  const columns = record.preview.length > 0 ? Object.keys(record.preview[0]) : [];
  const isTruncated = record.recordsCount > PREVIEW_LIMIT;

  // Detect numeric columns for right-align
  const numericCols = new Set(
    columns.filter(col => record.preview.some(row => typeof row[col] === 'number'))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center space-x-4 flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dtMeta?.iconBg ?? 'bg-gray-50'}`}>
            <Icon className={`h-5 w-5 ${dtMeta?.iconColor ?? 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">{record.fileName}</p>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ${dtMeta?.badgeBg} ${dtMeta?.badgeText} ${dtMeta?.badgeRing}`}>
                {record.label}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 font-medium">{record.recordsCount.toLocaleString()} records</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                {record.format}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{columns.length} columns</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Truncation notice */}
        {isTruncated && (
          <div className="px-6 py-2.5 flex items-center space-x-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Showing first <span className="font-semibold">{PREVIEW_LIMIT}</span> of{' '}
              <span className="font-semibold">{record.recordsCount.toLocaleString()}</span> records
            </p>
          </div>
        )}

        {/* Table */}
        {record.preview.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12 text-gray-400 text-sm">
            No data available
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">#</th>
                  {columns.map(col => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${numericCols.has(col) ? 'text-right' : 'text-left'}`}
                    >
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {record.preview.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-4 py-2.5 text-xs text-gray-300 font-mono">{i + 1}</td>
                    {columns.map(col => (
                      <td
                        key={col}
                        className={`px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap ${numericCols.has(col) ? 'text-right font-mono tabular-nums' : ''}`}
                      >
                        {formatCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DataUpload() {
  const [uploading, setUploading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [uploadedType, setUploadedType] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);
  const [viewingRecord, setViewingRecord] = useState<UploadRecord | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    setUploadHistory(loadHistory());
  }, []);

  // Close modal on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setViewingRecord(null);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, dataType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-uploaded if needed
    event.target.value = '';

    setUploading(true);
    setUploadResult(null);
    setUploadedType(dataType);

    try {
      const result = await uploadCSV(dataType, file);
      setUploadResult(result);

      if (result.success) {
        const dtMeta = DATA_TYPES.find(d => d.id === dataType);
        const ext = file.name.split('.').pop()?.toUpperCase() || 'CSV';
        const record: UploadRecord = {
          id: Date.now(),
          fileName: file.name,
          dataType,
          label: dtMeta?.label ?? dataType,
          recordsCount: result.records_count,
          format: ext,
          uploadedAt: new Date().toISOString(),
          preview: (result.data ?? []).slice(0, PREVIEW_LIMIT),
        };
        const updated = [record, ...uploadHistory];
        setUploadHistory(updated);
        saveHistory(updated);
      }
    } catch (error: any) {
      setUploadResult({ success: false, errors: [error.message] });
    } finally {
      setUploading(false);
    }
  };

  const removeHistoryEntry = (id: number) => {
    const updated = uploadHistory.filter(r => r.id !== id);
    setUploadHistory(updated);
    saveHistory(updated);
    if (viewingRecord?.id === id) setViewingRecord(null);
  };

  const clearHistory = () => {
    setUploadHistory([]);
    saveHistory([]);
    setViewingRecord(null);
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

      {/* Upload Cards */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Upload Data</h3>
          <p className="text-xs text-gray-400 mt-0.5">Import CSV or Excel files to power your simulations</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DATA_TYPES.map((dt) => {
              const Icon = dt.icon;
              const uploadedForType = uploadHistory.filter(r => r.dataType === dt.id).length;
              return (
                <label
                  key={dt.id}
                  className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer transition-all duration-200 ${dt.borderHover} ${dt.bgHover} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploadedForType > 0 && (
                    <span className={`absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${dt.badgeBg} ${dt.badgeText} ${dt.badgeRing}`}>
                      {uploadedForType} file{uploadedForType > 1 ? 's' : ''}
                    </span>
                  )}
                  <div className={`w-14 h-14 ${dt.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className={`h-7 w-7 ${dt.iconColor}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{dt.label}</h4>
                  <p className="text-xs text-gray-400 mb-4">{dt.description}</p>
                  <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload File</span>
                  </span>
                  <p className="text-xs text-gray-300 mt-2">CSV, XLSX or XLS</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
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
              uploadResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}>
              {uploadResult.success
                ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
              <p className={`text-sm font-medium ${uploadResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                {uploadResult.success
                  ? `Successfully uploaded ${uploadResult.records_count} records from ${uploadedType?.replace('_', ' ')} file`
                  : `Upload failed: ${uploadResult.errors?.join(', ')}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files History */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Uploaded Files</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {uploadHistory.length === 0
                  ? 'No files uploaded yet'
                  : `${uploadHistory.length} file${uploadHistory.length > 1 ? 's' : ''} — click a row to preview`}
              </p>
            </div>
          </div>
          {uploadHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {uploadHistory.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No files uploaded yet</p>
            <p className="text-xs text-gray-300 mt-1">Your uploaded files will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {uploadHistory.map((record) => {
              const dtMeta = DATA_TYPES.find(d => d.id === record.dataType);
              const Icon = dtMeta?.icon ?? FileText;
              return (
                <div
                  key={record.id}
                  className="flex items-center px-6 py-4 hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => setViewingRecord(record)}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dtMeta?.iconBg ?? 'bg-gray-50'}`}>
                    <Icon className={`h-4 w-4 ${dtMeta?.iconColor ?? 'text-gray-400'}`} />
                  </div>

                  {/* File info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
                      {record.fileName}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ring-1 ${dtMeta?.badgeBg} ${dtMeta?.badgeText} ${dtMeta?.badgeRing}`}>
                        {record.label}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{record.recordsCount.toLocaleString()} records</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                        {record.format}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="ml-4 flex items-center space-x-1 text-xs text-gray-400 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(record.uploadedAt)}</span>
                  </div>

                  {/* Action buttons — visible on hover */}
                  <div className="ml-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewingRecord(record); }}
                      className="p-1.5 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 text-gray-400 transition-all"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeHistoryEntry(record.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Horizon (days)</label>
                <input type="number" name="time_horizon" defaultValue="30" min="1" max="365" className={inputClass} required />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Affected Products <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input type="text" name="affected_products" placeholder="PROD001, PROD002, PROD003" className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>Base Inventory</label>
                <input type="number" name="base_inventory" defaultValue="1000" min="0" className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>Demand Rate <span className="text-gray-400 font-normal">(units/day)</span></label>
                <input type="number" name="demand_rate" defaultValue="50" min="0" className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>Overstock Factor</label>
                <input type="number" name="overstock_factor" defaultValue="2.0" step="0.1" min="1" className={inputClass} />
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
            <div className={`mt-5 p-4 rounded-xl border ${simulationResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {simulationResult.success ? (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-800">Simulation completed successfully!</p>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-emerald-700 pl-7">
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
                  <p className="text-sm font-medium text-red-800">Simulation failed: {simulationResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      {viewingRecord && (
        <FilePreviewModal record={viewingRecord} onClose={() => setViewingRecord(null)} />
      )}
    </div>
  );
}
