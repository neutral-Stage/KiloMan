// ===== KILO MAN - Level Data =====

import { LevelEntity, EntityType } from './types';

// Sample level data - will be expanded in future commits
export const levelEntities: LevelEntity[] = [
  // Start position
  {
    id: 'start-1',
    x: 100,
    y: 400,
    w: 40,
    h: 40,
    type: 'start',
    color: '#00ff00',
  },
  
  // Basic platforms
  {
    id: 'platform-1',
    x: 200,
    y: 450,
    w: 200,
    h: 20,
    type: 'platform',
    color: '#8b4513',
  },
  {
    id: 'platform-2',
    x: 500,
    y: 380,
    w: 180,
    h: 20,
    type: 'platform',
    color: '#8b4513',
  },
  {
    id: 'platform-3',
    x: 800,
    y: 320,
    w: 220,
    h: 20,
    type: 'platform',
    color: '#8b4513',
  },
  
  // Hazards (spikes/pits)
  {
    id: 'hazard-1',
    x: 350,
    y: 430,
    w: 40,
    h: 20,
    type: 'hazard',
    color: '#ff0000',
  },
  {
    id: 'hazard-2',
    x: 600,
    y: 360,
    w: 30,
    h: 20,
    type: 'hazard',
    color: '#ff0000',
  },
  
  // Goal/flag
  {
    id: 'goal-1',
    x: 1200,
    y: 200,
    w: 30,
    h: 100,
    type: 'goal',
    color: '#ffff00',
  },
  
  // Monsters (patrolling enemies)
  {
    id: 'monster-1',
    x: 400,
    y: 410,
    w: 30,
    h: 30,
    type: 'monster',
    color: '#ff0000',
    patrolRange: 100,
    speed: 0.5,
  },
  {
    id: 'monster-2',
    x: 700,
    y: 340,
    w: 30,
    h: 30,
    type: 'monster',
    color: '#ff0000',
    patrolRange: 150,
    speed: 0.3,
  },
];

// Level configuration
export const levelConfig = {
  // Total width of the world (for camera clamping)
  levelWidth: 1500,
  // Starting position for player
  playerStartX: 100,
  playerStartY: 400,
};