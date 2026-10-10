# LunaBot: Autonomous Navigation of Robot for Lunar Habitat

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black.svg)](https://threejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-1.6-green.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An academic Artificial Intelligence and Machine Learning mini-project simulating an autonomous planetary rover navigating an unstructured three-dimensional lunar surface.

---

## 1. Project Overview & Vision

**LunaBot** is a high-fidelity client-side simulation designed to demonstrate autonomous path planning, dynamic obstacle avoidance, and frontier exploration in an airless, hazardous lunar habitat environment.

The rover navigates procedural lunar terrain consisting of craters with depressed bowls and raised rims, scattered impact boulders, ridges, and slopes. It evaluates terrain traversability using a discrete 2.5D navigation grid, computes Pareto-optimal routes with a risk-aware **A\*** pathfinding algorithm, reacts immediately to newly introduced dynamic obstacles via real-time replanning, and executes frontier-based autonomous exploration.

---

## 2. Core Technical Features

### 🌕 Procedural 3D Lunar Environment
- **Heightmap Generation**: Seeded pseudo-random number generator (Mulberry32) combined with multi-octave 2D fractal noise.
- **Realistic Impact Craters**: Procedural crater depressions with parabolic inner bowls and raised ejecta rims.
- **Boulder Fields**: Power-law distribution of rocks and boulders scattered across the regolith.
- **Airless Lunar Lighting**: Low-angle harsh directional solar lighting with sharp cast shadows and starry cosmic skybox.
- **Visual Overlays**:
  - Wireframe navigation grid
  - Terrain-risk heatmap (Safe, Moderate, High, Blocked)
  - Explored-area sensor footprint overlay
  - Glowing 3D trajectory ribbons with destination beacons

### 🤖 6-Wheeled Virtual Rover Model
- Detailed 3D model featuring an avionics deck covered in gold MLI thermal foil, high-gain communications dish, elevated sensor mast with stereo cameras, LiDAR turret, and dual LED headlights.
- 6 titanium regolith wheels mounted on rocker-bogie suspension rods with rotational animations synchronized to movement speed.
- Dynamic pitch and roll alignment conforming to local surface normals.
- Free Orbit Camera and third-person Rover Chase Camera follow modes.

### 🧭 Risk-Aware A* Path Planning
- Discretized 2.5D navigation grid classifying terrain based on slope gradients, boulder clearances, and boundary limits.
- Configurable Pareto routing strategies:
  - **Shortest**: Minimizes physical distance traveled.
  - **Safer**: Heavily penalizes steep slopes (>18°) and boulder proximity to protect mechanical integrity.
  - **Balanced**: Optimal balance between travel time, energy, and terrain difficulty.
- Admissible octile distance heuristic ensuring algorithmic completeness and optimal routes.
- Corner-cutting prevention across diagonal blocker pairs.

### ⚡ Dynamic Obstacle Avoidance & Replanning (Mandatory Review Feature)
- Operators can inject unexpected boulders into the lunar landscape at runtime.
- If a new obstacle intersects the rover's planned trajectory:
  1. The rover immediately halts to prevent collision.
  2. The navigation grid marks the newly obstructed cell.
  3. A* recomputes a safe detour around the hazard.
  4. Movement automatically resumes with an updated trajectory.
  5. The replanning event is recorded in the mission telemetry and timestamped event log.

### 🛰️ Autonomous Frontier Exploration Mode
- Frontier-based autonomous exploration detects reachable cells on the border between explored and unexplored regolith.
- Clusters candidate frontiers using 8-connectivity breadth-first search.
- Selects targets maximizing information gain while penalizing travel distance and terrain risk.
- Incrementally surveys the exploration sector and halts when reachable frontiers are exhausted.

### 🔋 Physics-Inspired Energy Model & Telemetry
- Computes power draw from baseline avionics, vehicle speed, and uphill incline mechanical resistance.
- Emits warnings at low battery thresholds (<25%) and emergency halts at critical levels (<10%).
- Real-time IMU attitude gauges (Heading, Pitch, Roll), speed, odometer, and coordinate tracking.

### 📊 Mission Analytics & Data Export
- Telemetry curves rendered with Recharts (Battery discharge curve, velocity profile).
- One-click export of comprehensive debrief reports to **JSON** and **CSV**.
- Persistent historical mission logs stored in browser LocalStorage.

---

## 3. Technology Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript (Strict typing)
- **3D Graphics Engine**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling**: Tailwind CSS (Mission control dark charcoal aesthetic)
- **Telemetry Charts**: Recharts
- **Icons**: Lucide React
- **Unit Testing**: Vitest

---

## 4. System Architecture

```
d:\miniproject\
├── index.html
├── package.json
├── vite.config.ts           # Configured with base: './' for static portability
├── tailwind.config.js       # Space-mission-control theme palette
├── src/
│   ├── types/
│   │   ├── navigation.ts    # GridCell, Waypoint, PathResult, PathStrategy
│   │   ├── rover.ts         # RoverState, TelemetryData, RoverConfig
│   │   ├── terrain.ts       # TerrainConfig, Crater, RockObstacle, ScientificPOI
│   │   └── mission.ts       # MissionEvent, MissionReport, MissionStatus
│   ├── core/
│   │   ├── terrainGenerator.ts # Seeded PRNG & procedural lunar heightmap
│   │   ├── navigationGrid.ts   # 2.5D hazard classification & slope evaluator
│   │   ├── astar.ts            # Risk-aware A* pathfinder & strategy comparator
│   │   ├── exploration.ts      # Frontier clustering & exploration target selector
│   │   ├── energyModel.ts      # Kinematics & incline energy model
│   │   ├── scenarioPresets.ts  # 10 repeatable academic test scenarios
│   │   └── exportUtils.ts      # JSON and CSV export generators
│   ├── components/
│   │   ├── simulation/
│   │   │   ├── LunarCanvas.tsx              # Three.js Canvas & camera manager
│   │   │   ├── LunarTerrain.tsx             # 3D procedural terrain & boulder mesh
│   │   │   ├── VirtualRover.tsx             # 6-wheeled rover with rocker-bogie
│   │   │   ├── GridOverlay.tsx              # Instanced Risk Heatmap & Nav Grid
│   │   │   ├── PathVisualizer.tsx           # 3D trajectory ribbons & beacons
│   │   │   ├── DynamicObstacleVisualizer.tsx# Hazard boulders with warning rings
│   │   │   └── POIVisualizer.tsx            # Floating science diamond beacons
│   │   └── ui/
│   │       ├── Header.tsx                   # Top bar with operational badges
│   │       ├── MissionControlPanel.tsx      # Start, Pause, Abort, Reset, Seed
│   │       ├── NavigationPanel.tsx          # Strategy selector & overlay toggles
│   │       ├── TelemetryPanel.tsx           # IMU, battery meter & odometer HUD
│   │       ├── EventLogPanel.tsx            # Real-time timestamped event stream
│   │       ├── AnalyticsPanel.tsx           # Telemetry charts & success rate
│   │       ├── MissionReportModal.tsx       # Post-mission debrief & exports
│   │       ├── ScenariosModal.tsx           # 10 automated test scenarios
│   │       └── HelpModal.tsx                # Architectural guide & manual
│   └── test/
│       ├── astar.test.ts        # Unit tests for A* pathfinding
│       ├── energyModel.test.ts  # Unit tests for battery depletion
│       └── exploration.test.ts  # Unit tests for frontier exploration
```

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone or navigate to the workspace
cd d:\miniproject

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Running Unit Tests
```bash
npm test
```
Runs 11 automated test cases verifying A* pathfinding, dynamic obstacle avoidance, energy draw, and frontier exploration.

### Building for Production
```bash
npm run build
```
Generates a fully standalone static build inside the `dist/` directory.

### Previewing the Production Build
```bash
npm run preview
```

---

## 6. Demonstration Guide for Project Evaluation

During an academic project presentation, follow this sequence:

### Step 1: 3D Environment & Rover Inspection
1. Use **Left Click + Drag** to rotate the camera around the lunar surface. Notice the craters with depressed centers and raised rims, scattered boulders, and airless space lighting.
2. Toggle **Nav Grid** and **Risk Heatmap** in the Navigation panel. Observe the color-coded cells:
   - 🟢 **Green**: Safe flat regolith (<10° slope).
   - 🟡 **Yellow**: Moderate slope (10°–18°).
   - 🟠 **Orange**: High slope or boulder proximity (18°–28°).
   - 🔴 **Red**: Impassable obstacles or sheer cliffs (>28°).

### Step 2: Target Navigation & Strategy Comparison
1. Click anywhere on the 3D lunar terrain to set a destination waypoint.
2. Review the **Route Optimization Comparison** card.
3. Switch between **Shortest**, **Safer**, and **Balanced** routing strategies to see how A* adjusts route curvature around crater rims and boulder fields.
4. Click **Start Target Nav**. Watch the rover smoothly follow waypoints, rotating its wheels and adjusting pitch and roll to match surface elevation.

### Step 3: Dynamic Obstacle Injection & Real-Time Replanning (Mandatory Feature)
1. While the rover is in transit, click **Insert Obstacle** in the Mission Control panel.
2. Click directly on the 3D terrain in front of the moving rover along its path ribbon.
3. Observe:
   - The rover detects the newly blocked path and immediately halts.
   - The system transitions to **REPLANNING ROUTE**.
   - A* calculates a safe detour around the new boulder.
   - The rover resumes transit along the replanned trajectory.
   - The event log displays the timestamped replanning milestone.

### Step 4: Frontier Autonomous Exploration
1. Click **Auto Explore** in the Mission Control panel.
2. The rover identifies unexplored frontier quadrants, clusters them, selects the highest-utility target, and sweeps the lunar quadrant.
3. Watch the **Exploration Coverage %** bar in the Telemetry HUD increment as the rover marks cells as explored.

### Step 5: Scientific POI Discovery & Telemetry Debrief
1. Direct the rover near any of the floating holographic scientific markers (e.g., *Pyroclastic Glass Deposit* or *Shackleton Rim Volatiles*).
2. The marker turns green, awards discovery points, and logs a scientific event.
3. When the mission completes, click **Report** in the top bar to inspect the final mission debrief.
4. Click **Export JSON** or **Export CSV** to demonstrate downloadable telemetry data.

### Step 6: 10 Preset Test Scenarios
1. Click **Test Scenarios** in the top bar.
2. Select any of the 10 pre-configured academic validation scenarios (e.g. *3. Steep Crater Rim Avoidance*, *4. Dynamic Obstacle Interception*, *7. Long-Range Incline & Energy Draw*).
3. Click **Load Scenario** to demonstrate deterministic, repeatable validation.

---

## 7. Deployment & Portability

- **Zero External Dependencies**: 100% client-side simulation. No database, server backend, or paid API keys required.
- **Portability**: Configured with Vite `base: './'` for instant deployment to GitHub Pages, Netlify, Vercel, or any static web host.
- **Offline Capable**: Procedural assets generated algorithmically in WebGL without requiring external textures.
