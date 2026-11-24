import Phaser from 'phaser';
import { bladeBottom, bladeTop, BLADE_X_END, BLADE_X_START } from './hudBladeProfile';
import { HUD_GREEN_TROUGH, HUD_GREEN_WELL, HUD_MANA_TROUGH, HUD_MANA_WELL } from './hudWells';

/**
 * Variante B (fiel): la Espada del Caos dibujada con formas suavizadas (antialias), sin píxel
 * duro. Es arte original con primitivas de Phaser; no usa imágenes ni texturas de God of War.
 *
 * Se dibuja una vez en una textura runtime y se muestra como una imagen: un Graphics sin
 * tamaño queda fuera del culling de la cámara y no se pinta. Coordenadas absolutas del lienzo.
 */
const TEXTURE_KEY = 'hud-faithful-chaos-blade';
/** Área de la textura: cubre la hoja, la punta y el medallón (x 0..207, y 0..59). */
const ART_WIDTH = 208;
const ART_HEIGHT = 60;

const STEEL_BASE = 0x6f6f78;
const STEEL_EDGE = 0xbdb8ae;
const STEEL_FULLER = 0x9aa0a8;
const STEEL_SHADOW = 0x2e2a2a;
const OUTLINE = 0x17100c;
const BRONZE = 0x8a6128;
const BRONZE_LIGHT = 0xe2b75b;
const GOLD = 0xc49a45;
const TROUGH = 0x140d0b;
const MEDALLION_DARK = 0x2a2622;

export function createFaithfulHudSkin(scene: Phaser.Scene, depth: number): Phaser.GameObjects.Image[] {
  if (!scene.textures.exists(TEXTURE_KEY)) {
    drawFaithfulBlade(scene);
  }
  return [scene.add.image(0, 0, TEXTURE_KEY).setOrigin(0, 0).setScrollFactor(0).setDepth(depth)];
}

function drawFaithfulBlade(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // Hoja: silueta compartida con la variante A (dientes arriba, punta curva hacia arriba).
  const blade: { x: number; y: number }[] = [];
  for (let x = BLADE_X_START; x <= BLADE_X_END; x += 1) blade.push({ x, y: bladeTop(x) });
  for (let x = BLADE_X_END; x >= BLADE_X_START; x -= 1) blade.push({ x, y: bladeBottom(x) });
  g.fillStyle(STEEL_BASE, 1).fillPoints(blade, true);
  // Brillo en el borde de arriba y sombra en el de abajo, con el mismo recorrido.
  const top: { x: number; y: number }[] = [];
  const bottom: { x: number; y: number }[] = [];
  for (let x = BLADE_X_START; x <= BLADE_X_END; x += 1) {
    top.push({ x, y: bladeTop(x) + 1.5 });
    bottom.push({ x, y: bladeBottom(x) - 2 });
  }
  g.lineStyle(2, STEEL_EDGE, 0.85).strokePoints(top, false);
  g.lineStyle(2, STEEL_SHADOW, 0.95).strokePoints(bottom, false);
  g.lineStyle(1.2, STEEL_FULLER, 0.55).lineBetween(40, 30, 150, 30);
  g.lineStyle(1, OUTLINE, 1).strokePoints(blade, true);

  // Pozos de bronce con su canal oscuro: las barras se dibujan encima con la misma lógica.
  drawWell(g, HUD_GREEN_WELL);
  drawWell(g, HUD_MANA_WELL);
  g.fillStyle(TROUGH, 1).fillRect(HUD_GREEN_TROUGH.x, HUD_GREEN_TROUGH.y, HUD_GREEN_TROUGH.w, HUD_GREEN_TROUGH.h);
  g.fillStyle(TROUGH, 1).fillRect(HUD_MANA_TROUGH.x, HUD_MANA_TROUGH.y, HUD_MANA_TROUGH.w, HUD_MANA_TROUGH.h);

  // Collarín que une el medallón con la hoja, y dos eslabones de cadena.
  g.fillStyle(BRONZE, 1).fillRoundedRect(26, 27, 6, 14, 2);
  g.lineStyle(1, OUTLINE, 1).strokeRoundedRect(26, 27, 6, 14, 2);
  g.fillStyle(GOLD, 1).fillEllipse(24, 24, 5, 3);
  g.fillStyle(GOLD, 1).fillEllipse(24, 42, 5, 3);

  // Medallón: aro oscuro, bisel de bronce, esfera oscura y un reflejo de luz (radio 14.5).
  g.fillStyle(OUTLINE, 1).fillCircle(15.5, 33, 14.5);
  g.fillStyle(BRONZE, 1).fillCircle(15.5, 33, 13);
  g.fillStyle(MEDALLION_DARK, 1).fillCircle(15.5, 33, 11);
  g.lineStyle(1.6, 0xbdb6aa, 0.45).beginPath();
  g.arc(15.5, 33, 7.5, Phaser.Math.DegToRad(-150), Phaser.Math.DegToRad(-100), false);
  g.strokePath();

  // Cadena que sale del medallón y gema dorada, como en la variante A.
  g.fillStyle(0xf2a33a, 1).fillCircle(16, 14, 3.2);
  g.lineStyle(1, OUTLINE, 1).strokeCircle(16, 14, 3.2);
  for (const [cx, cy] of [[24, 25], [29, 20], [34, 15]] as const) {
    g.fillStyle(BRONZE, 1).fillEllipse(cx, cy, 8.5, 6);
    g.lineStyle(1.2, OUTLINE, 1).strokeEllipse(cx, cy, 8.5, 6);
  }

  g.generateTexture(TEXTURE_KEY, ART_WIDTH, ART_HEIGHT);
  g.destroy();
}

/** Bisel de bronce con un brillo arriba; el canal oscuro se pinta después. */
function drawWell(g: Phaser.GameObjects.Graphics, well: { x: number; y: number; w: number; h: number }): void {
  g.fillStyle(BRONZE, 1).fillRoundedRect(well.x, well.y, well.w, well.h, 2);
  g.lineStyle(1, BRONZE_LIGHT, 0.8).lineBetween(well.x + 2, well.y + 0.5, well.x + well.w - 2, well.y + 0.5);
  g.lineStyle(1, OUTLINE, 1).strokeRoundedRect(well.x, well.y, well.w, well.h, 2);
}
