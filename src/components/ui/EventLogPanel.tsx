import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { MissionEvent, EventSeverity } from '../../types/mission';

interface EventLogPanelProps {
  events: MissionEvent[];
  onClearLogs: () => void;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ events, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'warning' | 'critical' | 'success'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.severity === filter;
  });

  const getSeverityBadge = (severity: EventSeverity) => {
    switch (severity) {
      case 'critical':
        return <span className="text-telemetry-red font-bold">[CRITICAL]</span>;
      case 'warning':
        return <span className="text-telemetry-amber font-bold">[WARN]</span>;
      case 'success':
        return <span className="text-telemetry-emerald font-bold">[OK]</span>;
      case 'info':
      default:
        return <span className="text-telemetry-cyan font-semibold">[INFO]</span>;
    }
  };

  return (
    <div className="bg-lunar-900 border border-lunar-800 rounded-lg p-3 text-slate-200 select-none space-y-2 font-mono flex flex-col h-60">
      {/* Log Header */}
      <div className="flex items-center justify-between border-b border-lunar-800 pb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-telemetry-cyan" />
          <span>MISSION EVENT LOG</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-1.5 py-0.5 rounded ${
              filter === 'all' ? 'bg-lunar-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-1.5 py-0.5 rounded ${
              filter === 'warning' ? 'bg-amber-950 text-telemetry-amber' : 'text-slate-500 hover:text-amber-400'
            }`}
          >
            Warn
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-1.5 py-0.5 rounded ${
              filter === 'critical' ? 'bg-red-950 text-telemetry-red' : 'text-slate-500 hover:text-red-400'
            }`}
          >
            Crit
          </button>
          <button
            onClick={onClearLogs}
            className="p-1 hover:text-slate-200 text-slate-500 transition-colors ml-1"
            title="Clear Logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scrollable Event Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[11px] font-mono scrollbar-thin scrollbar-thumb-lunar-800"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-slate-500 text-center py-6 italic text-[11px]">
            No mission events logged yet.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`p-1.5 rounded border transition-colors leading-relaxed ${
                event.severity === 'critical'
                  ? 'bg-red-950/40 border-red-500/40 text-red-200'
                  : event.severity === 'warning'
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  : event.severity === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-lunar-950/80 border-lunar-850 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                <span className="text-slate-500 font-normal">{event.timeString}</span>
                {getSeverityBadge(event.severity)}
                <span className="font-semibold text-slate-200">{event.title}</span>
              </div>
              <div className="text-[10px] text-slate-300 pl-2 border-l border-slate-700/50">
                {event.details}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
