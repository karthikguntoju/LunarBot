import { MissionReport } from '../types/mission';

export function exportMissionReportJSON(report: MissionReport): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `lunabot_mission_${report.missionId}_report.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportMissionReportCSV(report: MissionReport): void {
  const rows = [
    ['Metric', 'Value', 'Unit'],
    ['Mission ID', report.missionId, ''],
    ['Mission Mode', report.mode, ''],
    ['Navigation Strategy', report.strategy, ''],
    ['Status', report.status, ''],
    ['Status Message', `"${report.statusMessage.replace(/"/g, '""')}"`, ''],
    ['Start Time', new Date(report.startTime).toISOString(), ''],
    ['End Time', new Date(report.endTime).toISOString(), ''],
    ['Duration', report.durationSeconds.toFixed(1), 'seconds'],
    ['Distance Traveled', report.distanceTraveledMeters.toFixed(1), 'meters'],
    ['Energy Consumed', report.estimatedEnergyWh.toFixed(1), 'Wh'],
    ['Initial Battery', report.initialBatteryPercent.toFixed(1), '%'],
    ['Final Battery', report.finalBatteryPercent.toFixed(1), '%'],
    ['Average Speed', report.averageSpeedMps.toFixed(2), 'm/s'],
    ['Peak Slope Traversed', report.peakSlopeTraversedDeg.toFixed(1), 'degrees'],
    ['Hazards Encountered', report.hazardsEncountered.toString(), 'count'],
    ['Replanning Events', report.replanCount.toString(), 'count'],
    ['Exploration Coverage', report.explorationCoveragePercent.toFixed(1), '%'],
    ['Scientific POIs Visited', report.scientificPOIsVisited.length.toString(), 'count'],
    ['Scientific Score Earned', report.totalScientificScore.toString(), 'points'],
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodeURI(csvContent));
  downloadAnchor.setAttribute('download', `lunabot_mission_${report.missionId}_report.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
