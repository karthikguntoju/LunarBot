import React from 'react';
import { X, PlayCircle, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { SCENARIO_PRESETS, ScenarioPreset } from '../../core/scenarioPresets';

interface ScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: ScenarioPreset) => void;
  activeScenarioId?: string;
}

export const ScenariosModal: React.FC<ScenariosModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  activeScenarioId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-lunar-900 border border-lunar-700 w-full max-w-3xl max-h-[85vh] rounded-xl flex flex-col font-mono text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-lunar-800 flex items-center justify-between bg-lunar-950">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-telemetry-amber" />
            <div>
              <div className="font-bold tracking-wide text-slate-100 text-sm">
                ACADEMIC TEST & VALIDATION SCENARIOS
              </div>
              <div className="text-[10px] text-slate-400">
                10 Deterministic Scenarios for AI & Robotics Demonstration
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-lunar-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of 10 Presets */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin scrollbar-thumb-lunar-800">
          {SCENARIO_PRESETS.map((scenario) => {
            const isActive = activeScenarioId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-lg'
                    : 'bg-lunar-950 hover:bg-lunar-900 border-lunar-800 hover:border-lunar-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100">{scenario.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-lunar-850 text-telemetry-cyan border border-lunar-750 uppercase">
                        {scenario.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-lunar-850 text-slate-400 border border-lunar-750 uppercase">
                        {scenario.strategy}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed">
                      {scenario.description}
                    </div>

                    {/* Expected Validation Output */}
                    <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-300">Expected Result: </strong>
                        {scenario.expectedResult}
                      </span>
                    </div>
                  </div>

                  {/* Load Button */}
                  <button
                    onClick={() => {
                      onSelectScenario(scenario);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-900/50'
                        : 'bg-lunar-800 hover:bg-cyan-600 hover:text-black text-slate-200 border border-lunar-700 hover:border-cyan-400'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Active' : 'Load Scenario'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-lunar-800 bg-lunar-950 flex justify-between items-center text-xs text-slate-400">
          <span>Clicking 'Load Scenario' automatically prepares the rover, target, and hazard setup.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-lunar-800 hover:bg-lunar-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
