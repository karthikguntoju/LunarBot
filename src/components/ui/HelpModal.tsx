import React from 'react';
import { X, BookOpen, Compass, Shield, Cpu, Zap, Eye, Terminal } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-lunar-900 border border-lunar-700 w-full max-w-3xl max-h-[85vh] rounded-xl flex flex-col font-mono text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-lunar-800 flex items-center justify-between bg-lunar-950">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-telemetry-cyan" />
            <span className="font-bold tracking-wide text-slate-100 text-sm">
              LUNABOT ARCHITECTURE & SYSTEM GUIDE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-lunar-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono scrollbar-thin scrollbar-thumb-lunar-800">
          {/* Section 1 */}
          <div className="bg-lunar-950 p-3.5 rounded-lg border border-lunar-800 space-y-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-telemetry-cyan">
              <Compass className="w-4 h-4" />
              <span>1. Lunar Rover Autonomous Navigation Principles</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              LunaBot demonstrates autonomous planetary exploration across rough regolith landscapes without
              teleoperation lag. The lunar environment is procedurally generated using deterministic seeded
              fractal noise, crater depressions with raised ejecta rims, and boulder scatter fields.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-lunar-950 p-3.5 rounded-lg border border-lunar-800 space-y-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-telemetry-emerald">
              <Cpu className="w-4 h-4" />
              <span>2. Risk-Aware A* Path Planning & Heuristic Cost Function</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              The continuous 3D lunar terrain is discretized into a 2.5D grid representation where each cell
              evaluates elevation, local gradient slope, boulder collisions, and boundary proximity:
            </p>
            <div className="p-2 rounded bg-lunar-900 border border-lunar-800 text-[11px] text-slate-200">
              <code>Cost(n) = Dist(3D) × W_dist + Slope_Factor × W_slope + Risk_Factor × W_risk</code>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
              <li><strong className="text-slate-200">Shortest Strategy:</strong> Minimizes Euclidean travel distance, tolerating moderate slopes.</li>
              <li><strong className="text-slate-200">Safer Strategy:</strong> Heavy penalty on steep slopes and boulder proximity; circumvents hazards.</li>
              <li><strong className="text-slate-200">Balanced Strategy:</strong> Optimal Pareto compromise between energy, distance, and slope mechanical strain.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-lunar-950 p-3.5 rounded-lg border border-lunar-800 space-y-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-telemetry-amber">
              <Shield className="w-4 h-4" />
              <span>3. Dynamic Hazard Injection & Real-Time Replanning</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              During transit, operators can inject sudden dynamic obstacles (fallen boulders, regolith shifts).
              The rover detects path interception, comes to a controlled halt, updates the navigation grid,
              computes a valid detour route via A*, logs the replan event, and resumes movement.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-lunar-950 p-3.5 rounded-lg border border-lunar-800 space-y-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-telemetry-cyan">
              <Eye className="w-4 h-4" />
              <span>4. Frontier-Based Autonomous Exploration Mode</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              In Autonomous Exploration Mode, LunaBot identifies boundary cells between known explored terrain
              and unknown areas. It clusters these frontier regions and selects high-utility exploration targets
              based on size, proximity, and low terrain risk, systematically surveying the lunar sector.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-lunar-950 p-3.5 rounded-lg border border-lunar-800 space-y-1.5">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-slate-300">
              <Terminal className="w-4 h-4" />
              <span>5. Operator Viewport Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div><strong className="text-telemetry-cyan">Left Click + Drag:</strong> Orbit 3D Camera</div>
              <div><strong className="text-telemetry-cyan">Right Click + Drag:</strong> Pan 3D Viewport</div>
              <div><strong className="text-telemetry-cyan">Scroll Wheel:</strong> Zoom In / Out</div>
              <div><strong className="text-telemetry-cyan">Click 3D Terrain:</strong> Select Target / Drop Obstacle</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-lunar-800 bg-lunar-950 flex justify-end">
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
