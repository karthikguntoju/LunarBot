import React from 'react';
import {
  Sliders,
  Eye,
  Grid,
  Flame,
  Footprints,
  Video,
  Zap,
  Shield,
  Ruler,
  Info,
} from 'lucide-react';
import { PathStrategy, PathComparison } from '../../types/navigation';

interface NavigationPanelProps {
  strategy: PathStrategy;
  onSelectStrategy: (strat: PathStrategy) => void;
  pathComparison: PathComparison | null;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  showNavGrid: boolean;
  onToggleNavGrid: () => void;
  showRiskHeatmap: boolean;
  onToggleRiskHeatmap: () => void;
  showExploredOverlay: boolean;
  onToggleExploredOverlay: () => void;
  followRover: boolean;
  onToggleFollowRover: () => void;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  strategy,
  onSelectStrategy,
  pathComparison,
  speedMultiplier,
  onSpeedChange,
  showNavGrid,
  onToggleNavGrid,
  showRiskHeatmap,
  onToggleRiskHeatmap,
  showExploredOverlay,
  onToggleExploredOverlay,
  followRover,
  onToggleFollowRover,
}) => {
  return (
    <div className="bg-lunar-900 border border-lunar-800 rounded-lg p-3 text-slate-200 select-none space-y-3 font-mono">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-lunar-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sliders className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>NAVIGATION & OVERLAYS</span>
        </div>
        <span className="text-[10px] text-slate-400">A* PATH ENGINE</span>
      </div>

      {/* 1. Path Planning Strategy Radio */}
      <div className="space-y-1.5">
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Routing Strategy:</span>
          <span className="text-telemetry-cyan font-bold uppercase">{strategy}</span>
        </div>

        <div className="grid grid-cols-3 gap-1 text-xs">
          <button
            onClick={() => onSelectStrategy('shortest')}
            className={`py-1.5 px-2 rounded border text-center transition-all ${
              strategy === 'shortest'
                ? 'bg-cyan-950 border-cyan-500 text-telemetry-cyan font-semibold'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200 hover:border-lunar-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Ruler className="w-3 h-3" />
              <span>Shortest</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStrategy('safer')}
            className={`py-1.5 px-2 rounded border text-center transition-all ${
              strategy === 'safer'
                ? 'bg-emerald-950 border-emerald-500 text-telemetry-emerald font-semibold'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200 hover:border-lunar-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Safer</span>
            </div>
          </button>

          <button
            onClick={() => onSelectStrategy('balanced')}
            className={`py-1.5 px-2 rounded border text-center transition-all ${
              strategy === 'balanced'
                ? 'bg-amber-950 border-amber-500 text-telemetry-amber font-semibold'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200 hover:border-lunar-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Balanced</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Route Alternative Evaluation Table */}
      {pathComparison && pathComparison[strategy] && (
        <div className="bg-lunar-950 rounded p-2 border border-lunar-800 text-[10px] space-y-1">
          <div className="text-slate-400 font-semibold border-b border-lunar-850 pb-1 flex items-center justify-between">
            <span>Route Optimization Comparison</span>
            <span className="text-emerald-400">A* Validated</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div>
              <div className="text-slate-500">DISTANCE</div>
              <div className="font-bold text-slate-200">
                {pathComparison[strategy]?.totalDistance.toFixed(1)} m
              </div>
            </div>
            <div>
              <div className="text-slate-500">AVG RISK</div>
              <div className="font-bold text-slate-200">
                {pathComparison[strategy]?.averageRisk.toFixed(1)}x
              </div>
            </div>
            <div>
              <div className="text-slate-500">ENERGY (EST)</div>
              <div className="font-bold text-telemetry-cyan">
                {pathComparison[strategy]?.estimatedEnergy.toFixed(1)} Wh
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Rover Speed Control Slider */}
      <div className="space-y-1 bg-lunar-950 p-2 rounded border border-lunar-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Simulation Speed:</span>
          <span className="text-telemetry-cyan font-bold">{speedMultiplier.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="4.0"
          step="0.5"
          value={speedMultiplier}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-lunar-800 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>0.5x Realtime</span>
          <span>2.0x</span>
          <span>4.0x Warp</span>
        </div>
      </div>

      {/* 4. 3D Viewport Overlays */}
      <div className="space-y-1.5">
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>3D Viewport Overlays:</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {/* Nav Grid */}
          <button
            onClick={onToggleNavGrid}
            className={`py-1.5 px-2 rounded border flex items-center gap-1.5 transition-colors ${
              showNavGrid
                ? 'bg-cyan-950/80 border-cyan-500/60 text-telemetry-cyan font-medium'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="text-[11px]">Nav Grid</span>
          </button>

          {/* Risk Heatmap */}
          <button
            onClick={onToggleRiskHeatmap}
            className={`py-1.5 px-2 rounded border flex items-center gap-1.5 transition-colors ${
              showRiskHeatmap
                ? 'bg-amber-950/80 border-amber-500/60 text-telemetry-amber font-medium'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[11px]">Risk Heatmap</span>
          </button>

          {/* Explored Overlay */}
          <button
            onClick={onToggleExploredOverlay}
            className={`py-1.5 px-2 rounded border flex items-center gap-1.5 transition-colors ${
              showExploredOverlay
                ? 'bg-emerald-950/80 border-emerald-500/60 text-telemetry-emerald font-medium'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span className="text-[11px]">Explored Area</span>
          </button>

          {/* Rover Follow Camera */}
          <button
            onClick={onToggleFollowRover}
            className={`py-1.5 px-2 rounded border flex items-center gap-1.5 transition-colors ${
              followRover
                ? 'bg-cyan-950/80 border-cyan-500/60 text-telemetry-cyan font-medium'
                : 'bg-lunar-950 border-lunar-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span className="text-[11px]">Chase Cam</span>
          </button>
        </div>
      </div>
    </div>
  );
};
