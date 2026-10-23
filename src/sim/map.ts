import { CONFIG } from '../config';

export interface LevelSegment {
  id: number;
  name: string;
  xStart: number;
  xEnd: number;
  isArena?: boolean;
  barrierLeftX?: number;
  barrierRightX?: number;
  arenaScrollX?: number;
}

export interface CameraBounds {
  deadzoneX: number;
  scrollMinX: number;
  scrollMaxX: number;
  parallaxFactor: number;
}

export interface LevelMapData {
  id: string;
  name: string;
  width: number;
  height: number;
  groundY: number;
  segments: readonly LevelSegment[];
  camera: CameraBounds;
}

export function buildLevel1Map(): LevelMapData {
  const cfg = CONFIG.map.level1;
  return {
    id: 'level1',
    name: 'Mar Egeo - Cubierta de Guerra',
    width: cfg.width,
    height: cfg.height,
    groundY: cfg.groundY,
    segments: [
      {
        id: cfg.segments.poopDeck.id,
        name: cfg.segments.poopDeck.name,
        xStart: cfg.segments.poopDeck.xStart,
        xEnd: cfg.segments.poopDeck.xEnd,
      },
      {
        id: cfg.segments.centralArena.id,
        name: cfg.segments.centralArena.name,
        xStart: cfg.segments.centralArena.xStart,
        xEnd: cfg.segments.centralArena.xEnd,
        isArena: true,
        barrierLeftX: cfg.segments.centralArena.barrierLeftX,
        barrierRightX: cfg.segments.centralArena.barrierRightX,
        arenaScrollX: cfg.segments.centralArena.arenaScrollX,
      },
      {
        id: cfg.segments.bowDeck.id,
        name: cfg.segments.bowDeck.name,
        xStart: cfg.segments.bowDeck.xStart,
        xEnd: cfg.segments.bowDeck.xEnd,
      },
    ],
    camera: {
      deadzoneX: cfg.camera.deadzoneX,
      scrollMinX: cfg.camera.scrollMinX,
      scrollMaxX: cfg.camera.scrollMaxX,
      parallaxFactor: cfg.camera.parallaxFactor,
    },
  };
}

export function getSegmentAtX(map: LevelMapData, x: number): LevelSegment {
  for (let i = 0; i < map.segments.length; i += 1) {
    const seg = map.segments[i];
    if (x >= seg.xStart && x < seg.xEnd) {
      return seg;
    }
  }
  return map.segments[map.segments.length - 1];
}

/**
 * Cálculo puro y determinista del desplazamiento horizontal de cámara (scrollX):
 * - En modo arena (isArenaActive = true): la cámara se fija en arenaScrollX (480 px).
 * - En modo normal: sigue a Kratos con una zona muerta horizontal (deadzoneX) alrededor del centro de vista (240 px).
 * - El desplazamiento queda acotado dentro de [scrollMinX, scrollMaxX] = [0, 960].
 */
export function computeCameraScrollX(
  playerX: number,
  currentScrollX: number,
  isArenaActive: boolean,
  arenaScrollX: number,
  bounds: CameraBounds,
): number {
  if (isArenaActive) {
    return arenaScrollX;
  }

  const viewCenter = 240;
  const deadzone = bounds.deadzoneX;
  const leftEdge = currentScrollX + viewCenter - deadzone;
  const rightEdge = currentScrollX + viewCenter + deadzone;

  let nextScrollX = currentScrollX;
  if (playerX < leftEdge) {
    nextScrollX = playerX - (viewCenter - deadzone);
  } else if (playerX > rightEdge) {
    nextScrollX = playerX - (viewCenter + deadzone);
  }

  return Math.max(bounds.scrollMinX, Math.min(bounds.scrollMaxX, nextScrollX));
}
