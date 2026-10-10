import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { X, BarChart3, Award, Clock, MapPin, Zap, AlertTriangle, Trash2 } from 'lucide-react';
import { MissionReport } from '../../types/mission';

interface AnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  telemetryHistory: Array<{ time: number; battery: number; distance: number; speed: number }>;
  missionHistory: MissionReport[];
  onClearHistory: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  isOpen,
  onClose,
  telemetryHistory,
  missionHistory,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  // Calculate Success Rate across completed missions
  const totalMissions = missionHistory.length;
  const successfulMissions = missionHistory.filter((m) => m.status === 'completed').length;
  const successRate = totalMissions > 0 ? Math.round((successfulMissions / totalMissions) * 100) : 100;

  const totalDistance = missionHistory.reduce((acc, m) => acc + m.distanceTraveledMeters, 0);
  const totalEnergy = missionHistory.reduce((acc, m) => acc + m.estimatedEnergyWh, 0);
  const totalReplans = missionHistory.reduce((acc, m) => acc + m.replanCount, 0);
  const totalPOIs = missionHistory.reduce((acc, m) => acc + m.scientificPOIsVisited.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-lunar-900 border border-lunar-700 w-full max-w-4xl max-h-[85vh] rounded-xl flex flex-col font-mono text-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-lunar-800 flex items-center justify-between bg-lunar-950">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-telemetry-cyan" />
            <span className="font-bold tracking-wide text-slate-100">
              MISSION TELEMETRY ANALYTICS & HISTORICAL PERFORMANCE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-lunar-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-lunar-800">
          {/* Key Aggregate Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-lunar-950 p-3 rounded-lg border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Mission Success Rate</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {successRate}%{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({successfulMissions}/{totalMissions || 1})
                </span>
              </div>
            </div>

            <div className="bg-lunar-950 p-3 rounded-lg border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-telemetry-cyan" />
                <span>Cumulative Distance</span>
              </div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {totalDistance.toFixed(1)}{' '}
                <span className="text-[10px] text-slate-500 font-normal">meters</span>
              </div>
            </div>

            <div className="bg-lunar-950 p-3 rounded-lg border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-telemetry-amber" />
                <span>Total Energy Consumed</span>
              </div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {totalEnergy.toFixed(1)}{' '}
                <span className="text-[10px] text-slate-500 font-normal">Wh</span>
              </div>
            </div>

            <div className="bg-lunar-950 p-3 rounded-lg border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Replanning Events</span>
              </div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {totalReplans}{' '}
                <span className="text-[10px] text-slate-500 font-normal">reroutes</span>
              </div>
            </div>
          </div>

          {/* Chart 1: Battery Discharge Curve vs Distance */}
          <div className="bg-lunar-950 p-4 rounded-lg border border-lunar-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Telemetry: Battery Discharge Curve (%)</span>
              <span className="text-[10px] text-slate-500">Real-time Kinematic Energy Model</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory.length > 0 ? telemetryHistory : [{ distance: 0, battery: 100 }]}>
                  <defs>
                    <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f59b" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#00f59b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232936" />
                  <XAxis dataKey="distance" stroke="#526078" unit="m" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#526078" unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d0f14', borderColor: '#343c4e', fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="battery"
                    stroke="#00f59b"
                    fillOpacity={1}
                    fill="url(#batteryGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Rover Instantaneous Velocity Profile */}
          <div className="bg-lunar-950 p-4 rounded-lg border border-lunar-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Telemetry: Rover Velocity Profile (m/s)</span>
              <span className="text-[10px] text-slate-500">Autonomous Acceleration & Braking</span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory.length > 0 ? telemetryHistory : [{ distance: 0, speed: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232936" />
                  <XAxis dataKey="distance" stroke="#526078" unit="m" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 4.5]} stroke="#526078" unit="m/s" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d0f14', borderColor: '#343c4e', fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Test Missions Table */}
          <div className="bg-lunar-950 p-4 rounded-lg border border-lunar-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Recorded Mission Log History ({missionHistory.length})</span>
              {missionHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {missionHistory.length === 0 ? (
              <div className="text-slate-500 text-center py-4 text-xs italic">
                No past missions recorded in browser storage yet. Complete a mission to populate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-lunar-800 text-slate-500 text-[10px]">
                      <th className="py-1.5 px-2">MISSION ID</th>
                      <th className="py-1.5 px-2">MODE</th>
                      <th className="py-1.5 px-2">STRATEGY</th>
                      <th className="py-1.5 px-2">STATUS</th>
                      <th className="py-1.5 px-2">DIST (M)</th>
                      <th className="py-1.5 px-2">ENERGY (WH)</th>
                      <th className="py-1.5 px-2">REPLANS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missionHistory.map((m) => (
                      <tr key={m.missionId} className="border-b border-lunar-850 hover:bg-lunar-900/60">
                        <td className="py-1.5 px-2 text-telemetry-cyan font-semibold">{m.missionId}</td>
                        <td className="py-1.5 px-2 uppercase text-[10px]">{m.mode.replace('_', ' ')}</td>
                        <td className="py-1.5 px-2 uppercase text-[10px]">{m.strategy}</td>
                        <td className="py-1.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-950 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {m.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-1.5 px-2">{m.distanceTraveledMeters.toFixed(1)}</td>
                        <td className="py-1.5 px-2">{m.estimatedEnergyWh.toFixed(1)}</td>
                        <td className="py-1.5 px-2">{m.replanCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-lunar-800 bg-lunar-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-lunar-800 hover:bg-lunar-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
