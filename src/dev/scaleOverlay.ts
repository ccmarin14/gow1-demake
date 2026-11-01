import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { ScaleReference } from '../scale';

/**
 * DEV-only overlay that draws the reference scale on top of the running scene:
 * feet line, silhouette box and jump envelope.
 * Toggle with `SCALE_REFERENCE_TOGGLE_KEY`; it never touches the simulation.
 *
 * The module keeps the single active instance, so `ShellScene` needs no DEV
 * members. Every entry point below is only reachable from code guarded by
 * `import.meta.env.DEV`, which keeps the whole module out of production builds.
 */
export const SCALE_REFERENCE_TOGGLE_KEY = 'G';

let active: ScaleReferenceOverlay | null = null;

/** Creates the overlay for `scene` and makes it the active instance. */
export function attachScaleReferenceOverlay(scene: Phaser.Scene): void {
  active = new ScaleReferenceOverlay(scene);
}

/** Follows the player each frame while the overlay is visible. */
export function updateScaleReference(x: number, y: number, facing: -1 | 1): void {
  active?.update(x, y, facing);
}

export function toggleScaleReference(): boolean {
  return active?.toggle() ?? false;
}

export function isScaleReferenceVisible(): boolean {
  return active?.visible ?? false;
}

export class ScaleReferenceOverlay {
  private readonly reference: ScaleReference = CONFIG.scale;
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private label: Phaser.GameObjects.Text | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    // Registered without a global capture: the overlay must not swallow a key
    // the game or the browser still needs. Registering the Key also suppresses
    // the OS auto-repeat, so a held key toggles once.
    const key = scene.input.keyboard?.addKey(SCALE_REFERENCE_TOGGLE_KEY, false) ?? null;
    // Toggle from the key event instead of polling `JustDown` in `update`: when
    // the render loop is throttled a whole press can land inside a single frame,
    // and `Key.onUp` clears `_justDown` before the update loop can read it.
    key?.on(Phaser.Input.Keyboard.Events.DOWN, () => {
      this.toggle();
    });
  }

  get visible(): boolean {
    return this.graphics !== null;
  }

  toggle(): boolean {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
    return this.visible;
  }

  update(x: number, y: number, facing: -1 | 1): void {
    if (this.graphics && this.label) {
      this.draw(Math.round(x), Math.round(y), facing);
    }
  }

  private show(): void {
    this.graphics = this.scene.add.graphics().setDepth(8);
    this.label = this.scene.add
      .text(6, 28, this.describe(), {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '8px',
      })
      .setDepth(9);
  }

  private hide(): void {
    this.graphics?.destroy();
    this.graphics = null;
    this.label?.destroy();
    this.label = null;
  }

  private describe(): string {
    const { jump } = this.reference;
    return [
      `scale [${SCALE_REFERENCE_TOGGLE_KEY}]`,
      `apex ${jump.ticks.apexHeight.toFixed(1)}→${jump.doubleTicks.apexHeight.toFixed(1)}px`,
      `jump ${jump.ticks.horizontalReach.toFixed(1)}→${jump.doubleTicks.horizontalReach.toFixed(1)}px`,
    ].join(' · ');
  }

  private draw(x: number, y: number, facing: -1 | 1): void {
    const graphics = this.graphics;
    if (!graphics) {
      return;
    }
    const {
      scaleFeetColor,
      scaleSilhouetteColor,
      scaleJumpColor,
      scaleReferenceAlpha,
      scaleReferenceThickness,
    } = CONFIG.presentation;
    const { silhouette } = this.reference;
    const thickness = scaleReferenceThickness;
    graphics.clear();

    // Feet line: the sprite bottom sits on the simulation Y (anchorY = 1).
    // Half-pixel offsets keep the 1px reference lines crisp at native scale.
    graphics.lineStyle(thickness, scaleFeetColor, scaleReferenceAlpha);
    graphics.lineBetween(0, y + 0.5, CONFIG.internal.width, y + 0.5);
    graphics.lineBetween(x + 0.5, y - 3, x + 0.5, y + 3);

    // Silhouette box: the useful width and height of the player.
    graphics.lineStyle(thickness, scaleSilhouetteColor, scaleReferenceAlpha);
    graphics.strokeRect(
      Math.round(x - silhouette.halfWidth) + 0.5,
      y - silhouette.height + 0.5,
      silhouette.width - 1,
      silhouette.height - 1,
    );

    // Jump envelope: the full cycle (`maxJumps`) the feet can travel in front
    // while airborne. Drawn from `mapEnvelopes` so the DEV reference matches
    // the numbers the map stage consumes.
    const direction = facing >= 0 ? 1 : -1;
    const rise = Math.round(this.reference.mapEnvelopes.maxStepUp);
    const reach = Math.round(this.reference.mapEnvelopes.maxGapWidth);
    graphics.lineStyle(thickness, scaleJumpColor, scaleReferenceAlpha);
    graphics.strokeRect(
      (direction > 0 ? x : x - reach) + 0.5,
      y - rise + 0.5,
      reach - 1,
      rise - 1,
    );
  }
}
