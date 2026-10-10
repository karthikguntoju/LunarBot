import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Compass,
  PlusCircle,
  Trash2,
  Dice5,
  Navigation2,
  Crosshair,
  AlertOctagon,
} from 'lucide-react';
import { MissionStatus, MissionMode } from '../../types/mission';
import { GridCoord } from '../../types/navigation';

interface MissionControlPanelProps {
  status: MissionStatus;
  mode: MissionMode;
  targetCoord: GridCoord | null;
  isPlacingObstacle: boolean;
  onTogglePlaceObstacle: () => void;
  onStartMission: () => void;
  onPauseResume: () => void;
  onCancelMission: () => void;
  onResetSimulation: () => void;
  onStartAutonomousExploration: () => void;
  onClearDynamicObstacles: () => void;
  dynamicObstaclesCount: number;
  currentSeed: number;
  onChangeSeed: (seed: number) => void;
  onRandomizeSeed: () => void;
}

export const MissionControlPanel: React.FC<MissionControlPanelProps> = ({
  status,
  mode,
  targetCoord,
  isPlacingObstacle,
  onTogglePlaceObstacle,
  onStartMission,
  onPauseResume,
  onCancelMission,
  onResetSimulation,
  onStartAutonomousExploration,
  onClearDynamicObstacles,
  dynamicObstaclesCount,
  currentSeed,
  onChangeSeed,
  onRandomizeSeed,
}) => {
  const isNavigating = status === 'navigating' || status === 'exploring';
  const isPaused = status === 'paused';
  const canStart = (status === 'idle' || status === 'completed' || status === 'failed') && (targetCoord !== null || mode === 'autonomous_exploration');

  return (
    <div className="bg-lunar-900 border border-lunar-800 rounded-lg p-3 text-slate-200 select-none space-y-3 font-mono">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-lunar-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Navigation2 className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>MISSION DISPATCH</span>
        </div>
        <div className="text-[10px] text-slate-400">
          STATUS:{' '}
          <span className="text-telemetry-cyan uppercase">{status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Target Destination Indicator */}
      <div className="bg-lunar-950 p-2 rounded border border-lunar-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Crosshair className="w-3.5 h-3.5 text-telemetry-emerald" />
          <span>Nav Target:</span>
        </div>
        {targetCoord ? (
          <span className="font-bold text-telemetry-emerald">
            Grid ({targetCoord.x}, {targetCoord.y})
          </span>
        ) : (
          <span className="text-slate-500 italic text-[11px]">Click 3D Terrain to Pick</span>
        )}
      </div>

      {/* Primary Execution Control Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Start / Dispatch Route */}
        <button
          onClick={onStartMission}
          disabled={!canStart && !isPaused}
          className={`py-2 px-3 rounded font-bold transition-all flex items-center justify-center gap-1.5 border ${
            canStart
              ? 'bg-cyan-600 hover:bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-900/30'
              : 'bg-lunar-950 text-slate-600 border-lunar-800 cursor-not-allowed'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Target Nav</span>
        </button>

        {/* Start Autonomous Exploration */}
        <button
          onClick={onStartAutonomousExploration}
          disabled={isNavigating && mode === 'autonomous_exploration'}
          className={`py-2 px-3 rounded font-bold transition-all flex items-center justify-center gap-1.5 border ${
            !isNavigating || mode !== 'autonomous_exploration'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-900/30'
              : 'bg-lunar-950 text-slate-600 border-lunar-800 cursor-not-allowed'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Auto Explore</span>
        </button>

        {/* Pause / Resume */}
        <button
          onClick={onPauseResume}
          disabled={!isNavigating && !isPaused}
          className={`py-1.5 px-3 rounded font-semibold transition-all flex items-center justify-center gap-1.5 border ${
            isNavigating || isPaused
              ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/60 text-telemetry-amber'
              : 'bg-lunar-950 text-slate-600 border-lunar-800 cursor-not-allowed'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Cancel Mission */}
        <button
          onClick={onCancelMission}
          disabled={!isNavigating && !isPaused}
          className={`py-1.5 px-3 rounded font-semibold transition-all flex items-center justify-center gap-1.5 border ${
            isNavigating || isPaused
              ? 'bg-red-950/80 hover:bg-red-900 border-red-500/60 text-telemetry-red'
              : 'bg-lunar-950 text-slate-600 border-lunar-800 cursor-not-allowed'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Halt / Abort</span>
        </button>
      </div>

      {/* Dynamic Hazard Testing Tool (MANDATORY REQUIREMENT) */}
      <div className="bg-lunar-950 p-2.5 rounded border border-lunar-800 space-y-2">
        <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1 text-telemetry-amber">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>DYNAMIC HAZARD INJECTION</span>
          </div>
          <span className="text-[10px] text-slate-500">Active: {dynamicObstaclesCount}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <button
            onClick={onTogglePlaceObstacle}
            className={`py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 transition-colors font-medium ${
              isPlacingObstacle
                ? 'bg-amber-500 text-black border-amber-400 animate-pulse font-bold'
                : 'bg-lunar-900 hover:bg-lunar-850 border-lunar-700 text-telemetry-amber'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isPlacingObstacle ? 'Click Map to Drop' : 'Insert Obstacle'}</span>
          </button>

          <button
            onClick={onClearDynamicObstacles}
            disabled={dynamicObstaclesCount === 0}
            className={`py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 transition-colors ${
              dynamicObstaclesCount > 0
                ? 'bg-lunar-900 hover:bg-lunar-850 border-lunar-700 text-slate-300'
                : 'bg-lunar-950 border-lunar-850 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Hazards</span>
          </button>
        </div>
      </div>

      {/* Simulation Reset & Seed Control */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onResetSimulation}
          className="flex-1 py-1.5 px-3 rounded bg-lunar-950 hover:bg-lunar-850 border border-lunar-700 text-xs font-semibold text-slate-300 transition-colors flex items-center justify-center gap-1.5"
          title="Restore rover landing position, battery and clear hazards"
        >
          <RotateCcw className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>Reset Simulation</span>
        </button>

        <div className="flex items-center gap-1 bg-lunar-950 px-2 py-1 rounded border border-lunar-800 text-[11px]">
          <span className="text-slate-500">Seed:</span>
          <input
            type="number"
            value={currentSeed}
            onChange={(e) => onChangeSeed(parseInt(e.target.value) || 0)}
            className="w-12 bg-lunar-900 border border-lunar-700 rounded px-1 text-center text-slate-200"
          />
          <button
            onClick={onRandomizeSeed}
            className="p-1 hover:text-telemetry-cyan text-slate-400 transition-colors"
            title="Randomize Terrain Seed"
          >
            <Dice5 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
