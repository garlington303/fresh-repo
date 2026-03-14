import type { GridMap, MapSettings } from '../types';

function makeBrush(
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number,
  texture: string
): string {
  // Quake .map brush planes (6 planes defining an AABB)
  // Each plane is defined by 3 points traversed counter-clockwise when viewed from outside
  const planes = [
    // Top
    `( ${minX} ${minY} ${maxZ} ) ( ${maxX} ${minY} ${maxZ} ) ( ${maxX} ${maxY} ${maxZ} ) ${texture} 0 0 0 1 1`,
    // Bottom
    `( ${minX} ${maxY} ${minZ} ) ( ${maxX} ${maxY} ${minZ} ) ( ${maxX} ${minY} ${minZ} ) ${texture} 0 0 0 1 1`,
    // Left (min X)
    `( ${minX} ${minY} ${maxZ} ) ( ${minX} ${maxY} ${maxZ} ) ( ${minX} ${maxY} ${minZ} ) ${texture} 0 0 0 1 1`,
    // Right (max X)
    `( ${maxX} ${maxY} ${maxZ} ) ( ${maxX} ${minY} ${maxZ} ) ( ${maxX} ${minY} ${minZ} ) ${texture} 0 0 0 1 1`,
    // Front (max Y)
    `( ${minX} ${maxY} ${maxZ} ) ( ${maxX} ${maxY} ${maxZ} ) ( ${maxX} ${maxY} ${minZ} ) ${texture} 0 0 0 1 1`,
    // Back (min Y)
    `( ${maxX} ${minY} ${maxZ} ) ( ${minX} ${minY} ${maxZ} ) ( ${minX} ${minY} ${minZ} ) ${texture} 0 0 0 1 1`,
  ];
  return `{\n${planes.map(p => `  ${p}`).join('\n')}\n}`;
}

export function exportMap(grid: GridMap, settings: MapSettings): string {
  const { wallHeight, floorThickness, gridSize } = settings;
  const lines: string[] = [];

  lines.push('// Game: Quake');
  lines.push('// Format: Standard');
  lines.push('// entity 0');
  lines.push('{');
  lines.push('"classname" "worldspawn"');
  lines.push('"wad" "quake.wad"');

  let brushIndex = 0;

  grid.forEach((cell, key) => {
    if (cell.type !== 'wall' && cell.type !== 'floor') return;

    const [cx, cy] = key.split(',').map(Number);

    // Canvas Y -> Quake Y: invert Y axis
    const minX = cx * gridSize;
    const maxX = (cx + 1) * gridSize;
    // Invert Y: negate both, swap min/max
    const minY = -(cy + 1) * gridSize;
    const maxY = -cy * gridSize;

    let minZ: number, maxZ: number, texture: string;

    if (cell.type === 'wall') {
      minZ = 0;
      maxZ = wallHeight;
      texture = 'BRICK';
    } else {
      // floor
      minZ = -floorThickness;
      maxZ = 0;
      texture = 'GROUND1_6';
    }

    lines.push(`// brush ${brushIndex++}`);
    lines.push(makeBrush(minX, minY, minZ, maxX, maxY, maxZ, texture));
  });

  lines.push('}');

  // Player start entity
  let entityIndex = 1;
  grid.forEach((cell, key) => {
    if (cell.type !== 'player_start') return;

    const [cx, cy] = key.split(',').map(Number);
    const qx = cx * gridSize + gridSize / 2;
    const qy = -(cy * gridSize + gridSize / 2);
    const qz = 24; // slightly above floor

    lines.push(`// entity ${entityIndex++}`);
    lines.push('{');
    lines.push('"classname" "info_player_start"');
    lines.push(`"origin" "${qx} ${qy} ${qz}"`);
    lines.push('"angle" "0"');
    lines.push('}');
  });

  return lines.join('\n') + '\n';
}

export function downloadMap(content: string, filename = 'level.map'): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function saveToLocalStorage(grid: GridMap, settings: MapSettings): void {
  const obj: Record<string, unknown> = {};
  grid.forEach((cell, key) => { obj[key] = cell; });
  localStorage.setItem('level_sketcher_grid', JSON.stringify(obj));
  localStorage.setItem('level_sketcher_settings', JSON.stringify(settings));
}

export function loadFromLocalStorage(): { grid: GridMap; settings: MapSettings } | null {
  try {
    const gridRaw = localStorage.getItem('level_sketcher_grid');
    const settingsRaw = localStorage.getItem('level_sketcher_settings');
    if (!gridRaw || !settingsRaw) return null;
    const gridObj = JSON.parse(gridRaw) as Record<string, { type: string }>;
    const settings = JSON.parse(settingsRaw) as MapSettings;
    const grid: GridMap = new Map();
    for (const [key, val] of Object.entries(gridObj)) {
      grid.set(key, val as { type: 'wall' | 'floor' | 'player_start' });
    }
    return { grid, settings };
  } catch {
    return null;
  }
}
