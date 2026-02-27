import { useEffect, useState } from 'react';
import { getScenarios, getScenarioDetails } from '../services/api';
import { AlertTriangle, TrendingDown, Clock, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function ExecutiveDashboard() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await getScenarios();
      setScenarios(data);
      if (data.length > 0) {
        loadScenarioDetails(data[0].scenario_id);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioDetails = async (scenarioId: string) => {
    try {
      const details = await getScenarioDetails(scenarioId);
      setSelectedScenario(details);
    } catch (error) {
      console.error('Error loading scenario details:', error);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    const configs: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
      Critical: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', dot: 'bg-red-500' },
      High:     { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500' },
      Medium:   { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
      Low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
    };
    return configs[urgency] || { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200', dot: 'bg-gray-400' };
  };

  const getComplexityColor = (complexity: string) => {
    if (complexity === 'High') return 'text-red-600 bg-red-50';
    if (complexity === 'Medium') return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-56" />
        <div className="bg-white rounded-2xl h-48 shadow-card" />
        <div className="bg-white rounded-2xl h-48 shadow-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Executive Dashboard</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Critical insights and decision support for retail risk management
        </p>
      </div>

      {selectedScenario?.summary && (
        <>
          {/* Executive Summary Card */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            {/* Colored top accent */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #db2777)' }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedScenario.scenario.scenario_type.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      ID: {selectedScenario.scenario.scenario_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                {(() => {
                  const cfg = getUrgencyConfig(selectedScenario.summary.urgency_level);
                  return (
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span>{selectedScenario.summary.urgency_level} Urgency</span>
                    </span>
                  );
                })()}
              </div>

              {/* 3-point summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 border border-red-100 bg-red-50/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <h4 className="text-xs font-semibold text-red-800 uppercase tracking-wide">Revenue Risk</h4>
                  </div>
                  <p className="text-sm text-red-700 leading-relaxed">{selectedScenario.summary.revenue_risk}</p>
                </div>

                <div className="rounded-xl p-4 border border-indigo-100 bg-indigo-50/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <h4 className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Market Reason</h4>
                  </div>
                  <p className="text-sm text-indigo-700 leading-relaxed">{selectedScenario.summary.market_reason}</p>
                </div>

                <div className="rounded-xl p-4 border border-amber-100 bg-amber-50/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Urgency</h4>
                  </div>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    {selectedScenario.summary.urgency_level} — Immediate action required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Analysis */}
          {selectedScenario.impact && (
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Impact Analysis</h3>
              </div>
              <div className="p-6">
                {/* Overall score */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Overall Propagation Score</span>
                  <span className="text-2xl font-bold text-red-600">
                    {selectedScenario.impact.overall_score}<span className="text-sm font-medium text-gray-400">/10</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${(selectedScenario.impact.overall_score / 10) * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    }}
                  />
                </div>

                {/* Function impacts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(selectedScenario.impact.function_impacts).map(([func, impact]: [string, any]) => {
                    const pct = (impact / 10) * 100;
                    const color = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#10b981';
                    return (
                      <div key={func} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 capitalize mb-2">{func}</p>
                        <p className="text-xl font-bold text-gray-900 mb-2">{impact.toFixed(1)}</p>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Mitigation Strategies */}
          {selectedScenario.strategies && selectedScenario.strategies.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Recommended Actions</h3>
                <span className="text-xs text-gray-400">{selectedScenario.strategies.length} strategies</span>
              </div>
              <div className="p-4 space-y-3">
                {selectedScenario.strategies.map((strategy: any, index: number) => (
                  <div
                    key={strategy.strategy_id}
                    className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-indigo-600"
                      style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {strategy.strategy_name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{strategy.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-gray-600">
                            {(strategy.effectiveness_score * 100).toFixed(0)}% effective
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{strategy.timeline_days} days</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getComplexityColor(strategy.implementation_complexity)}`}>
                          {strategy.implementation_complexity} complexity
                        </span>
                        {strategy.cost_estimate && (
                          <span className="text-xs text-gray-500 font-medium">
                            ${strategy.cost_estimate.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!selectedScenario && !loading && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">No Active Scenarios</h3>
          <p className="text-sm text-gray-400">Upload data and run simulations to see executive insights</p>
        </div>
      )}
    </div>
  );
}
