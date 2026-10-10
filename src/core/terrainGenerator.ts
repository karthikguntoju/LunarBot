import { Crater, RockObstacle, ScientificPOI, TerrainConfig } from '../types/terrain';
import { GridCoord, WorldCoord } from '../types/navigation';

// Deterministic PRNG: Mulberry32
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed ? Math.abs(seed) : 123456789;
  }

  // Returns float in [0, 1)
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

// 2D Simplex/Value noise with octave synthesis for realistic fractal lunar regolith
export class LunarNoise {
  private perm: number[] = [];

  constructor(rng: SeededRandom) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Shuffle with RNG
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(rng.next() * (i + 1));
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    this.perm = p.concat(p);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }

  fractalNoise(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

export interface GeneratedTerrainModel {
  config: TerrainConfig;
  craters: Crater[];
  rocks: RockObstacle[];
  pois: ScientificPOI[];
  heightMap: Float32Array; // gridSize x gridSize
  getHeightAt: (worldX: number, worldZ: number) => number;
  getNormalAt: (worldX: number, worldZ: number) => [number, number, number];
}

export function generateLunarTerrain(config: TerrainConfig): GeneratedTerrainModel {
  const rng = new SeededRandom(config.seed);
  const noise = new LunarNoise(rng);

  const { gridSize, worldSize, maxElevation } = config;
  const halfWorld = worldSize / 2;

  // 1. Generate Procedural Craters
  const craters: Crater[] = [];
  const craterCount = config.craterCount;

  // Ensure 1 distinct large landmark crater, plus medium & small impact craters
  for (let i = 0; i < craterCount; i++) {
    // Keep craters away from the immediate start zone (center/spawn area: near -worldSize*0.35, -worldSize*0.35)
    let cx = rng.range(-halfWorld * 0.85, halfWorld * 0.85);
    let cz = rng.range(-halfWorld * 0.85, halfWorld * 0.85);

    // Keep start landing point relatively clear
    if (Math.hypot(cx - (-halfWorld * 0.6), cz - (-halfWorld * 0.6)) < 12) {
      cx += 18;
    }

    const isMajor = i === 0;
    const radius = isMajor ? rng.range(9, 14) : rng.range(4, 8);
    const depth = isMajor ? rng.range(3.5, 5.0) : rng.range(1.8, 3.2);
    const rimHeight = isMajor ? rng.range(1.2, 1.8) : rng.range(0.6, 1.1);

    craters.push({
      id: `crater-${i + 1}`,
      gridX: Math.floor(((cx + halfWorld) / worldSize) * gridSize),
      gridY: Math.floor(((cz + halfWorld) / worldSize) * gridSize),
      worldX: cx,
      worldZ: cz,
      radius,
      depth,
      rimHeight,
    });
  }

  // 2. Base Height Evaluation Function
  const calculateBaseHeight = (worldX: number, worldZ: number): number => {
    // Multi-scale regolith roughness
    const nx = (worldX + halfWorld) / 35;
    const nz = (worldZ + halfWorld) / 35;
    const baseUndulation = noise.fractalNoise(nx, nz, 4, 0.45, 2.1) * maxElevation;

    // Micro-ridges
    const microDetail = noise.noise2D(worldX * 0.15, worldZ * 0.15) * 0.4;

    let height = baseUndulation + microDetail;

    // Apply crater depressions and raised rims
    for (const crater of craters) {
      const dist = Math.hypot(worldX - crater.worldX, worldZ - crater.worldZ);
      const r = crater.radius;

      if (dist < r) {
        // Depression inside the bowl
        const normDist = dist / r;
        const bowlFactor = 1 - Math.pow(normDist, 2);
        height -= crater.depth * bowlFactor;
      }

      // Elevated rim and ejecta blanket
      const rimPeakDist = r;
      const rimWidth = r * 0.35;
      const rimDiff = Math.abs(dist - rimPeakDist);
      if (rimDiff < rimWidth) {
        const rimInfluence = Math.cos((rimDiff / rimWidth) * (Math.PI / 2));
        height += crater.rimHeight * Math.pow(rimInfluence, 2);
      }
    }

    return height;
  };

  // 3. Generate Heightmap Buffer
  const heightMap = new Float32Array(gridSize * gridSize);
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const wx = (gx / (gridSize - 1)) * worldSize - halfWorld;
      const wz = (gy / (gridSize - 1)) * worldSize - halfWorld;
      heightMap[gy * gridSize + gx] = calculateBaseHeight(wx, wz);
    }
  }

  // Bilinear interpolation for smooth sampling at arbitrary coordinates
  const getHeightAt = (worldX: number, worldZ: number): number => {
    const clampedX = Math.max(-halfWorld, Math.min(halfWorld, worldX));
    const clampedZ = Math.max(-halfWorld, Math.min(halfWorld, worldZ));

    const gx = ((clampedX + halfWorld) / worldSize) * (gridSize - 1);
    const gy = ((clampedZ + halfWorld) / worldSize) * (gridSize - 1);

    const x0 = Math.floor(gx);
    const x1 = Math.min(gridSize - 1, x0 + 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(gridSize - 1, y0 + 1);

    const tx = gx - x0;
    const ty = gy - y0;

    const h00 = heightMap[y0 * gridSize + x0];
    const h10 = heightMap[y0 * gridSize + x1];
    const h01 = heightMap[y1 * gridSize + x0];
    const h11 = heightMap[y1 * gridSize + x1];

    const h0 = h00 * (1 - tx) + h10 * tx;
    const h1 = h01 * (1 - tx) + h11 * tx;

    return h0 * (1 - ty) + h1 * ty;
  };

  // Surface Normal vector
  const getNormalAt = (worldX: number, worldZ: number): [number, number, number] => {
    const delta = 0.5;
    const hL = getHeightAt(worldX - delta, worldZ);
    const hR = getHeightAt(worldX + delta, worldZ);
    const hD = getHeightAt(worldX, worldZ - delta);
    const hU = getHeightAt(worldX, worldZ + delta);

    const dx = (hR - hL) / (2 * delta);
    const dz = (hU - hD) / (2 * delta);

    const len = Math.sqrt(dx * dx + 1 + dz * dz);
    return [-dx / len, 1 / len, -dz / len];
  };

  // 4. Generate Procedural Rocks / Boulders
  const rocks: RockObstacle[] = [];
  for (let i = 0; i < config.rockCount; i++) {
    const rx = rng.range(-halfWorld * 0.88, halfWorld * 0.88);
    const rz = rng.range(-halfWorld * 0.88, halfWorld * 0.88);

    // Keep start landing pad clear
    if (Math.hypot(rx - (-halfWorld * 0.6), rz - (-halfWorld * 0.6)) < 8) {
      continue;
    }

    const radius = rng.range(0.7, 1.8);
    const height = radius * rng.range(0.8, 1.5);
    const gx = Math.floor(((rx + halfWorld) / worldSize) * gridSize);
    const gy = Math.floor(((rz + halfWorld) / worldSize) * gridSize);

    rocks.push({
      id: `rock-${i + 1}`,
      gridX: Math.max(0, Math.min(gridSize - 1, gx)),
      gridY: Math.max(0, Math.min(gridSize - 1, gy)),
      worldX: rx,
      worldZ: rz,
      radius,
      height,
      isDynamic: false,
    });
  }

  // 5. Scientific Points of Interest (POIs)
  const poiDefinitions: Array<{
    name: string;
    category: ScientificPOI['category'];
    description: string;
    value: number;
    offset: [number, number];
  }> = [
    {
      name: 'Shackleton Rim Volatiles',
      category: 'ice_deposit',
      description: 'Permanent shadow zone with detected hydrogen signature indicative of water ice.',
      value: 95,
      offset: [0.35, -0.45],
    },
    {
      name: 'Pyroclastic Glass Deposit',
      category: 'volcanic_glass',
      description: 'High-titanium orange glass beads ejected during ancient explosive lunar volcanism.',
      value: 80,
      offset: [0.55, 0.4],
    },
    {
      name: 'Central Crater Peak Anorthosite',
      category: 'ancient_regolith',
      description: 'Pristine lunar highland crust uplifted from deep magma ocean crystallization.',
      value: 90,
      offset: [-0.1, 0.25],
    },
    {
      name: 'Mare Imbrium Basalt Ridge',
      category: 'structural_ridge',
      description: 'Compressional wrinkle ridge exposing stratified flood basalt layers.',
      value: 70,
      offset: [-0.5, 0.45],
    },
    {
      name: 'Ilmenite Mineral Outcrop',
      category: 'minerals',
      description: 'Rich iron-titanium oxide deposit critical for in-situ oxygen extraction (ISRU).',
      value: 85,
      offset: [0.15, -0.2],
    },
  ];

  const pois: ScientificPOI[] = poiDefinitions.map((def, idx) => {
    const wx = def.offset[0] * halfWorld;
    const wz = def.offset[1] * halfWorld;
    const gx = Math.floor(((wx + halfWorld) / worldSize) * gridSize);
    const gy = Math.floor(((wz + halfWorld) / worldSize) * gridSize);
    const wy = getHeightAt(wx, wz);

    return {
      id: `poi-${idx + 1}`,
      name: def.name,
      category: def.category,
      description: def.description,
      grid: { x: Math.max(0, Math.min(gridSize - 1, gx)), y: Math.max(0, Math.min(gridSize - 1, gy)) },
      world: { x: wx, y: wy, z: wz },
      scientificValue: def.value,
      visited: false,
    };
  });

  return {
    config,
    craters,
    rocks,
    pois,
    heightMap,
    getHeightAt,
    getNormalAt,
  };
}
