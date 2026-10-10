import React from 'react';
import {
  FileText,
  X,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Zap,
  Activity,
  Sparkles,
} from 'lucide-react';
import { MissionReport } from '../../types/mission';
import { exportMissionReportJSON, exportMissionReportCSV } from '../../core/exportUtils';

interface MissionReportModalProps {
  report: MissionReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MissionReportModal: React.FC<MissionReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  const isSuccess = report.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-lunar-900 border border-lunar-700 w-full max-w-2xl rounded-xl flex flex-col font-mono text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-lunar-800 flex items-center justify-between bg-lunar-950">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-telemetry-cyan" />
            <span className="font-bold tracking-wide text-slate-100">
              MISSION DEBRIEF REPORT // {report.missionId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-lunar-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[75vh]">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              isSuccess
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/60 border-red-500/50 text-red-200'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                MISSION {report.status.toUpperCase()}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">{report.statusMessage}</div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Elapsed Duration</span>
              </div>
              <div className="text-base font-bold text-slate-200 mt-1">
                {report.durationSeconds.toFixed(1)} s
              </div>
            </div>

            <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Total Distance</span>
              </div>
              <div className="text-base font-bold text-slate-200 mt-1">
                {report.distanceTraveledMeters.toFixed(1)} m
              </div>
            </div>

            <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800">
              <div className="text-slate-500 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-telemetry-amber" />
                <span>Energy Consumed</span>
              </div>
              <div className="text-base font-bold text-slate-200 mt-1">
                {report.estimatedEnergyWh.toFixed(1)} Wh
              </div>
            </div>

            <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800">
              <div className="text-slate-500">Average Velocity</div>
              <div className="text-base font-bold text-slate-200 mt-1">
                {report.averageSpeedMps.toFixed(2)} m/s
              </div>
            </div>

            <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800">
              <div className="text-slate-500">Max Incline Pitch</div>
              <div className="text-base font-bold text-slate-200 mt-1">
                {report.peakSlopeTraversedDeg.toFixed(1)}°
              </div>
            </div>

            <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800">
              <div className="text-slate-500">Replanning Events</div>
              <div className="text-base font-bold text-telemetry-amber mt-1">
                {report.replanCount}
              </div>
            </div>
          </div>

          {/* Science & Exploration Details */}
          <div className="bg-lunar-950 p-3 rounded-lg border border-lunar-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5 border-b border-lunar-850 pb-1.5">
              <Sparkles className="w-4 h-4 text-telemetry-cyan" />
              <span>Scientific Exploration & Coverage Harvest</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-500">Exploration Coverage: </span>
                <span className="font-bold text-telemetry-emerald">
                  {report.explorationCoveragePercent.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Scientific Score: </span>
                <span className="font-bold text-telemetry-cyan">
                  {report.totalScientificScore} pts
                </span>
              </div>
            </div>

            {report.scientificPOIsVisited.length > 0 ? (
              <div className="pt-1">
                <span className="text-slate-500 text-[11px]">Visited POIs: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.scientificPOIsVisited.map((poiName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-cyan-950 text-telemetry-cyan border border-cyan-500/40 text-[10px]"
                    >
                      ✓ {poiName}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-[11px] italic pt-1">
                No scientific points of interest surveyed in this specific sortie.
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-5 py-3 border-t border-lunar-800 bg-lunar-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportMissionReportJSON(report)}
              className="px-3 py-1.5 rounded bg-lunar-900 hover:bg-lunar-800 border border-lunar-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-telemetry-cyan" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => exportMissionReportCSV(report)}
              className="px-3 py-1.5 rounded bg-lunar-900 hover:bg-lunar-800 border border-lunar-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-telemetry-emerald" />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-lunar-800 hover:bg-lunar-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
