# Brief: dibujar `idle-00` de Kratos (tarea para otro agente)

Trabajas en gow-8b (Phaser 3.90 + TypeScript + Vite, 480×270). Tu tarea es UNA sola: dibujar el
cuadro `idle-00` de Kratos en ASCII. No hagas nada más.

**Antes de empezar** lee, en este orden: `AGENTS.md`, `docs/estado.md`, `docs/direccion.md`
(§3 y §5), `docs/decisiones.md` (D-25, D-26, D-28, D-29, D-31) y
`.agents/skills/pixel-art-character-consistency/SKILL.md`.

## Intento anterior: descártalo

Existe un `grids/kratos/idle-00.txt` y un `idle-00.landmarks.json` de un intento anterior que la
usuaria rechazó: figura de maniquí, simétrica y rígida, brazos como tablones, torso rectangular,
postura estrecha. **Sobrescríbelos desde cero**; no los uses como base. El validador mide cuánto
se alejaba: manos a 8 px y pies a 7 px de la referencia.

## Qué dibujar

- Pose neutral/reposo de Kratos, completa, escrita a mano en `grids/kratos/idle-00.txt` con la
  paleta `palette/kratos.json` (letras por rol).
- Solo cuerpo y vestimenta: SIN cadenas, SIN cuchillas, SIN sombra de suelo (son capas del motor).
- Lienzo solo-cuerpo **64×56**, pies en la fila 55 (fila de suelo).
- **Tiene que leerse como Kratos.** La pose es la de la referencia (abajo): **postura de combate**,
  piernas bien abiertas con las rodillas flexionadas, vista tres cuartos, hombros muy anchos con
  trapecios altos, torso en V que se estrecha a la cintura, brazos fuertes con antebrazos
  gruesos, cabeza calva con la marca roja y barba, taparrabos. No una figura simétrica y recta.

## La referencia (úsala; ya existe)

- `docs/temporal/idle-00.reference.txt`: el cuerpo del master heredado (sin cuchillas ni sombra)
  convertido a `palette/kratos.json` por **color más cercano** (`scripts/quantize_reference.py`).
  Es una guía para LEER y calcar a mano, no un cuadro final.
- `docs/temporal/idle-00.reference.landmarks.json`: coordenadas objetivo de cabeza, mentón,
  hombros, codos, manos, caderas, rodillas y pies, sacadas de esa referencia.
- Mírala ampliada con reglas:
  `python3 scripts/preview_grid.py docs/temporal/idle-00.reference.txt --palette palette/kratos.json --ground-row 55 --scale 9 --out /tmp/ref.png`
- **Limpieza que debes hacer a mano** al calcarla: (1) quita las hebras oscuras de cadena que
  cuelgan a los lados (aprox. x 10–22, y 30–52 y x 44–53, y 33–53); (2) las manos están en x 10–17, y 31–37 (izquierda) y x 47–53, y 33–36 (derecha), mezcladas con restos de empuñadura: dibuja allí un puño legible y quita el resto; (3) las letras de
  la referencia salen por color, no por material: `b` (bronce) suele ser en realidad sombra de piel
  o cuero. Decide tú el rol correcto al dibujar.

## Regla dura (D-31)

Ningún script, función o bucle puede generar o modificar el contenido de `grids/*.txt`. El `.txt`
se escribe con una herramienta de escritura de archivos, con las filas literales. Python se usa
SOLO para validar, rasterizar y previsualizar. La única ayuda con script que produce texto es
`quantize_reference.py`, y escribe fuera de `grids/` (se niega a escribir dentro). Si te
encuentras escribiendo `ellipse`, `draw_line` o un bucle que rellena caracteres, detente.
Tampoco derivar el cuadro desplazando o cizallando bloques de otro.

## Cómo trabajar

1. **Puntos de referencia.** Copia `docs/temporal/idle-00.reference.landmarks.json` a
   `grids/kratos/idle-00.landmarks.json`, cambia `"grid"` a `"idle-00.txt"` y ajusta los puntos a
   tu dibujo, **sin alejarte más de 3 px de la referencia**. Añade a cada punto los `roles` que
   debe tener ese píxel. Valida con:
   ```
   python3 scripts/check_landmarks.py grids/kratos/idle-00.landmarks.json \
     --delta docs/temporal/idle-00.reference.landmarks.json --max 3
   ```
   Si algún punto sale `FAIL delta`, tu pose se aparta de la referencia: corrígela.
2. **Tres pasadas**, cada una es el cuadro completo, no un parche:
   a) **Silueta:** 2 colores (`o` contorno y `s` relleno). La forma del cuerpo debe recordar a la
      referencia (V de hombros, postura abierta, rodillas flexionadas), no a un bloque.
      **Muéstrasela a la usuaria y ESPERA su aprobación antes de seguir.**
   b) **Sombreado:** piel clara/media/sombra, cuero, tela, marca roja.
   c) **Contorno y detalle:** vendas, cicatrices, barba, remates.
3. **Bucle visual** (máximo 3 rondas por pasada): rasteriza, MIRA la imagen ampliada, compárala
   con la referencia y la lista de abajo, corrige.
   ```
   python3 scripts/preview_grid.py grids/kratos/idle-00.txt docs/temporal/idle-00.reference.txt \
     --palette palette/kratos.json --ground-row 55 --scale 8 --out /tmp/idle-00.png
   ```
   Lista de comprobación: ¿hombros anchos con forma de V? ¿postura abierta con rodillas
   flexionadas? ¿cabeza con marca roja y barba? ¿ningún píxel de cadena, cuchilla o sombra?
   ¿pies en la fila 55? ¿antebrazos gruesos y vendados?
4. Valida con `pnpm art:check` y genera el PNG con `pnpm art`.
5. Muestra a la usuaria el cuadro ampliado junto a la referencia y **ESPERA su aprobación
   final**. No conectes nada al juego antes. **No hagas commit hasta esa aprobación** (un cuadro
   = un commit).

## Solo tras la aprobación final

- Aplica el lienzo 64×56: `frame_size` y `anchors.ground` (55) en `grids/kratos/manifest.json`, y
  `PLAYER_SPRITE_WIDTH/HEIGHT` en `src/config.ts` (única fuente).
- Retira `master.txt`, `idle-01.txt` y sus PNG heredados (`kratos-neutral`, `kratos-idle-01`),
  quita `master`/`master_png` del manifest y ajusta `scripts/check_grid.py` para no exigirlos.
- Conecta el cuadro en `src/assets/manifest.ts` (no dispersar `this.load` en `ShellScene`) como
  cuadro de idle.
- Enciende en `src/config.ts` `presentation.restPose.enabled` y `presentation.playerShadow.enabled`
  y ajusta sus offsets viendo el resultado. Revisa también los `hand` por movimiento (ART-02).
- Verifica en navegador real (Chrome headless por CDP): 0 errores de consola, 0 peticiones
  fallidas, y que se vea bien en reposo, mirando a ambos lados y en el aire. `pnpm build` verde NO
  basta.
- Actualiza `docs/estado.md` y **borra `docs/temporal/`** en el mismo commit (convencional, sin
  atribución de IA).

**No toques:** la física, la simulación, el resto de arte, ni documentos fuera de los listados.
No hagas push.
