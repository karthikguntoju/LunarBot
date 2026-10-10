import React from 'react';
import {
  Compass,
  Radio,
  Battery,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  FileText,
  BarChart2,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { MissionStatus, MissionMode } from '../../types/mission';
import { TelemetryData } from '../../types/rover';

interface HeaderProps {
  status: MissionStatus;
  mode: MissionMode;
  telemetry: TelemetryData;
  onOpenScenarios: () => void;
  onOpenAnalytics: () => void;
  onOpenReport: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  mode,
  telemetry,
  onOpenScenarios,
  onOpenAnalytics,
  onOpenReport,
  onOpenHelp,
}) => {
  // Status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case 'navigating':
        return { label: 'NAVIGATING', bg: 'bg-cyan-950/80', border: 'border-cyan-500/50', text: 'text-telemetry-cyan' };
      case 'replanning':
        return { label: 'REPLANNING ROUTE', bg: 'bg-amber-950/80', border: 'border-amber-500/50', text: 'text-telemetry-amber animate-pulse' };
      case 'obstacle_detected':
        return { label: 'OBSTACLE DETECTED', bg: 'bg-red-950/80', border: 'border-red-500/50', text: 'text-telemetry-red animate-pulse' };
      case 'exploring':
        return { label: 'AUTONOMOUS EXPLORING', bg: 'bg-emerald-950/80', border: 'border-emerald-500/50', text: 'text-telemetry-emerald' };
      case 'completed':
        return { label: 'MISSION COMPLETED', bg: 'bg-emerald-950/80', border: 'border-emerald-500/50', text: 'text-telemetry-emerald' };
      case 'failed':
        return { label: 'MISSION HALTED', bg: 'bg-red-950/80', border: 'border-red-500/50', text: 'text-telemetry-red' };
      case 'paused':
        return { label: 'PAUSED', bg: 'bg-amber-950/80', border: 'border-amber-500/50', text: 'text-telemetry-amber' };
      case 'planning':
        return { label: 'CALCULATING A* PATH', bg: 'bg-cyan-950/80', border: 'border-cyan-500/50', text: 'text-telemetry-cyan animate-pulse' };
      case 'idle':
      default:
        return { label: 'SYSTEM READY', bg: 'bg-lunar-850', border: 'border-lunar-700', text: 'text-slate-300' };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="h-14 border-b border-lunar-800 bg-lunar-950 px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Project Identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-cyan-950/70 border border-cyan-500/40 text-telemetry-cyan">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-wider text-sm text-slate-100">
              LUNABOT
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lunar-800 text-slate-400 border border-lunar-700">
              AUTONOMOUS LUNAR ROVER v1.0
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
            Lunar Habitat Autonomous Navigation & Hazard Avoidance Simulation
          </div>
        </div>
      </div>

      {/* Center Operational State Telemetry */}
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <div
          className={`px-3 py-1 rounded text-xs font-mono font-semibold tracking-wide border flex items-center gap-2 ${badge.bg} ${badge.border} ${badge.text}`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping opacity-75" />
          {badge.label}
        </div>

        {/* Mode Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-lunar-900 border border-lunar-800 text-[11px] font-mono text-slate-300">
          <span className="text-slate-400">MODE:</span>
          <span className="text-telemetry-cyan uppercase">
            {mode === 'target_navigation'
              ? 'Target Navigation'
              : mode === 'autonomous_exploration'
              ? 'Autonomous Exploration'
              : 'Scenario Test'}
          </span>
        </div>

        {/* Comm Link Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-lunar-900 border border-lunar-800 text-[11px] font-mono text-emerald-400">
          <Radio className="w-3.5 h-3.5" />
          <span>LINK: 100% (MET: UTC)</span>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenScenarios}
          className="px-2.5 py-1 rounded bg-lunar-900 hover:bg-lunar-800 border border-lunar-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
          title="Load 10 Academic Validation Scenarios"
        >
          <PlayCircle className="w-3.5 h-3.5 text-telemetry-amber" />
          <span className="hidden sm:inline">Test Scenarios</span>
        </button>

        <button
          onClick={onOpenAnalytics}
          className="px-2.5 py-1 rounded bg-lunar-900 hover:bg-lunar-800 border border-lunar-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
          title="Mission Telemetry Charts and Success Rates"
        >
          <BarChart2 className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span className="hidden sm:inline">Analytics</span>
        </button>

        <button
          onClick={onOpenReport}
          className="px-2.5 py-1 rounded bg-lunar-900 hover:bg-lunar-800 border border-lunar-700 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5"
          title="View Mission Summary & Export JSON/CSV"
        >
          <FileText className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Report</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded bg-lunar-900 hover:bg-lunar-800 border border-lunar-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="User Manual & Navigation Architecture Guide"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
