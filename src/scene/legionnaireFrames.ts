import type { EntityState } from '../sim/types';

/**
 * Selecciona el cuadro del legionario según su estado de la IA (`aiState`),
 * ticks de animación (`aiTicks`) y velocidad vertical (`vy`).
 *
 * Mapeo según brief y diseño (BL-21, D-51):
 * - `idle`, `guard`: reposo (`legionnaire-idle-00`).
 * - `approach`: ciclo de marcha (`legionnaire-walk-00..07` en bucle).
 * - `windup`: aviso con ojos llameantes (`legionnaire-windup-00..03`, el último sostenido; 24 ticks).
 * - `slash`: tajo agresivo (`legionnaire-slash-00..03`; 8 ticks).
 * - `recover`: recuperación (`legionnaire-recover-00..02`; 16 ticks).
 * - `hitstun`: aturdimiento (`legionnaire-hitstun-00..01`; 12 ticks o 32 si fue parry).
 * - `juggle`: suspensión aérea (`legionnaire-juggle-00` subiendo con vy < 0, `legionnaire-juggle-01` cayendo).
 * - `death`: desmoronamiento cadavérico (`legionnaire-death-00..02`, el último se sostiene).
 */
export function getLegionnaireFrameKey(enemy: Readonly<EntityState>): string {
  switch (enemy.aiState) {
    case 'idle':
    case 'guard':
    default:
      return 'legionnaire-idle-00';

    case 'patrol':
    case 'approach': {
      // 8 cuadros en bucle: walk-00..07 a 4 ticks por cuadro
      const frame = Math.floor(enemy.aiTicks / 4) % 8;
      return `legionnaire-walk-0${frame}`;
    }

    case 'windup': {
      // 4 cuadros en 24 ticks: 00..02 avanzan cada 4 ticks y 03 se sostiene de tick 12 a 24+
      const frame = Math.min(Math.floor(enemy.aiTicks / 4), 3);
      return `legionnaire-windup-0${frame}`;
    }

    case 'heavy_windup': {
      // Aviso prolongado de 36 ticks: 00..02 avanzan cada 6 ticks y 03 se sostiene de tick 18 a 36+
      const frame = Math.min(Math.floor(enemy.aiTicks / 6), 3);
      return `legionnaire-windup-0${frame}`;
    }

    case 'slash': {
      // 4 cuadros en 8 ticks (2 ticks por cuadro)
      const frame = Math.min(Math.floor(enemy.aiTicks / 2), 3);
      return `legionnaire-slash-0${frame}`;
    }

    case 'heavy_slash': {
      // Tajo pesado en 10 ticks (~2.5 ticks por cuadro)
      const frame = Math.min(Math.floor(enemy.aiTicks / 2.5), 3);
      return `legionnaire-slash-0${frame}`;
    }

    case 'recover': {
      // 3 cuadros en 16 ticks (5 ticks en 00, 5 ticks en 01, 6 ticks en 02)
      const frame = Math.min(Math.floor(enemy.aiTicks / 5), 2);
      return `legionnaire-recover-0${frame}`;
    }

    case 'hitstun': {
      // 2 cuadros en 12+ ticks: primer impacto (00) y aturdimiento (01)
      const frame = enemy.aiTicks < 6 ? 0 : 1;
      return `legionnaire-hitstun-0${frame}`;
    }

    case 'grabbed': {
      // Sujeto por Kratos: sostenido e inmovilizado
      return 'legionnaire-hitstun-00';
    }

    case 'weakened': {
      // Estado de debilitamiento groggy vulnerable a remate contextual (BL-07, ESE-01)
      return 'legionnaire-hitstun-01';
    }

    case 'juggle': {
      // juggle-00 si sube (vy < 0), juggle-01 si cae (vy >= 0)
      return enemy.vy < 0 ? 'legionnaire-juggle-00' : 'legionnaire-juggle-01';
    }

    case 'knockdown': {
      // Yace tendido de espaldas sobre la cubierta (death-02)
      return 'legionnaire-death-02';
    }

    case 'get_up': {
      // Se reincorpora: alza torso en death-01 (ticks 0 a 7) y asienta guardia en idle-00 (ticks 8+)
      return enemy.aiTicks < 8 ? 'legionnaire-death-01' : 'legionnaire-idle-00';
    }

    case 'death': {
      // 3 cuadros: desmoronamiento en ~40 ticks; death-02 se sostiene tendido
      const frame = Math.min(Math.floor(enemy.aiTicks / 8), 2);
      return `legionnaire-death-0${frame}`;
    }
  }
}
