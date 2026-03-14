export type CellType = 'wall' | 'floor' | 'player_start';

export type Tool = 'wall' | 'floor' | 'player_start' | 'eraser';

export interface Cell {
  type: CellType;
}

export type GridKey = string; // "x,y"

export type GridMap = Map<GridKey, Cell>;

export interface MapSettings {
  wallHeight: number;
  floorThickness: number;
  gridSize: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
