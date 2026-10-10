import React from 'react';
import {
  Battery,
  BatteryCharging,
  Gauge,
  Navigation,
  Compass,
  Mountain,
  ShieldAlert,
  Repeat,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { TelemetryData } from '../../types/rover';
import { MissionStatus } from '../../types/mission';

interface TelemetryPanelProps {
  telemetry: TelemetryData;
  status: MissionStatus;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry, status }) => {
  // Battery color
  const getBatteryColor = () => {
    if (telemetry.batteryPercent <= 15) return 'text-telemetry-red bg-red-950 border-red-500/50';
    if (telemetry.batteryPercent <= 30) return 'text-telemetry-amber bg-amber-950 border-amber-500/50';
    return 'text-telemetry-emerald bg-emerald-950 border-emerald-500/50';
  };

  const batteryBarWidth = `${Math.max(0, Math.min(100, telemetry.batteryPercent))}%`;

  return (
    <div className="bg-lunar-900 border border-lunar-800 rounded-lg p-3 text-slate-200 select-none space-y-3 font-mono">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-lunar-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Gauge className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>ROVER TELEMETRY</span>
        </div>
        <div className="text-[10px] text-slate-400">
          ID: <span className="text-telemetry-cyan">LB-LUNAR-01</span>
        </div>
      </div>

      {/* 1. Battery Gauge & Energy Meter */}
      <div className="bg-lunar-950 rounded p-2 border border-lunar-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Battery className="w-4 h-4 text-slate-300" />
            <span>Power Reserve:</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${getBatteryColor()}`}
          >
            {telemetry.batteryPercent.toFixed(1)}%
          </span>
        </div>

        {/* Battery Bar */}
        <div className="w-full bg-lunar-900 h-2 rounded-full overflow-hidden border border-lunar-850">
          <div
            className={`h-full transition-all duration-300 ${
              telemetry.batteryPercent <= 15
                ? 'bg-telemetry-red'
                : telemetry.batteryPercent <= 30
                ? 'bg-telemetry-amber'
                : 'bg-telemetry-emerald'
            }`}
            style={{ width: batteryBarWidth }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Consumed: {telemetry.estimatedEnergyConsumedWh.toFixed(1)} Wh</span>
          <span>Draw: ~{status === 'navigating' || status === 'exploring' ? '185' : '40'} W</span>
        </div>

        {telemetry.isBatteryLow && (
          <div className="text-[10px] text-telemetry-amber bg-amber-950/60 p-1 rounded border border-amber-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 flex-shrink-0" />
            <span>Warning: Rover battery below reserve threshold.</span>
          </div>
        )}
      </div>

      {/* 2. Kinematics & Coordinates Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Speed */}
        <div className="bg-lunar-950 p-2 rounded border border-lunar-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-telemetry-cyan" />
            <span>Speed (m/s)</span>
          </div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">
            {telemetry.speed.toFixed(2)}{' '}
            <span className="text-[10px] font-normal text-slate-400">m/s</span>
          </div>
        </div>

        {/* Distance */}
        <div className="bg-lunar-950 p-2 rounded border border-lunar-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-telemetry-emerald" />
            <span>Odometer</span>
          </div>
          <div className="text-sm font-bold text-slate-100 mt-0.5">
            {telemetry.totalDistanceTraveled.toFixed(1)}{' '}
            <span className="text-[10px] font-normal text-slate-400">m</span>
          </div>
        </div>

        {/* Rover Grid Position */}
        <div className="bg-lunar-950 p-2 rounded border border-lunar-800">
          <div className="text-[10px] text-slate-400">Grid Cell (X, Y)</div>
          <div className="text-xs font-bold text-telemetry-cyan mt-0.5">
            ({telemetry.gridCoord.x}, {telemetry.gridCoord.y})
          </div>
        </div>

        {/* World 3D Pos */}
        <div className="bg-lunar-950 p-2 rounded border border-lunar-800">
          <div className="text-[10px] text-slate-400">World Pos (X, Z)</div>
          <div className="text-xs font-bold text-slate-300 mt-0.5">
            {telemetry.position.x.toFixed(1)}, {telemetry.position.z.toFixed(1)}
          </div>
        </div>
      </div>

      {/* 3. Orientation & Gyroscope Attitude */}
      <div className="bg-lunar-950 rounded p-2 border border-lunar-800 text-[11px] space-y-1">
        <div className="text-[10px] text-slate-400 flex items-center gap-1 pb-1 border-b border-lunar-850">
          <Compass className="w-3 h-3 text-telemetry-cyan" />
          <span>Inertial Measurement Unit (IMU)</span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-0.5 text-center">
          <div>
            <div className="text-[9px] text-slate-500">HEADING</div>
            <div className="font-bold text-slate-200">{telemetry.headingDeg.toFixed(0)}°</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500">PITCH</div>
            <div className="font-bold text-slate-200">{telemetry.pitchDeg.toFixed(1)}°</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500">ROLL</div>
            <div className="font-bold text-slate-200">{telemetry.rollDeg.toFixed(1)}°</div>
          </div>
        </div>
      </div>

      {/* 4. Autonomous Mission Stats */}
      <div className="space-y-1 text-xs pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Repeat className="w-3 h-3 text-telemetry-amber" />
            <span>Route Replans:</span>
          </span>
          <span className="font-bold text-telemetry-amber">{telemetry.replanEventsCount}</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-telemetry-red" />
            <span>Hazards Detected:</span>
          </span>
          <span className="font-bold text-telemetry-red">{telemetry.hazardDetectionsCount}</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-telemetry-cyan" />
            <span>Science POIs Visited:</span>
          </span>
          <span className="font-bold text-telemetry-cyan">{telemetry.sciencePOIsVisited}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-slate-400">Exploration Coverage:</span>
          <span className="font-bold text-telemetry-emerald">
            {telemetry.explorationCoveragePercent.toFixed(1)}%
          </span>
        </div>

        {/* Coverage Progress Bar */}
        <div className="w-full bg-lunar-950 h-1.5 rounded-full overflow-hidden border border-lunar-850 mt-1">
          <div
            className="h-full bg-telemetry-cyan transition-all duration-300"
            style={{ width: `${Math.min(100, telemetry.explorationCoveragePercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
