Trabajas en gow-8b (Phaser 3.90 + TypeScript + Vite, 480×270). Tu tarea es UNA sola:
dibujar el cuadro `idle-00` de Kratos en ASCII. No hagas nada más.

ANTES DE EMPEZAR lee, en este orden: AGENTS.md, docs/estado.md, docs/direccion.md (§3 y §5),
docs/decisiones.md (D-25, D-26, D-28, D-29, D-31) y
.agents/skills/pixel-art-character-consistency/SKILL.md.

QUÉ DIBUJAR
- Un cuadro completo de pose neutral/reposo de Kratos, dibujado a mano en
  grids/kratos/idle-00.txt con la paleta palette/kratos.json (letras por rol).
- Solo cuerpo y vestimenta: SIN cadenas, SIN cuchillas, SIN sombra de suelo (esas son capas del
  motor: WeaponLayer y la sombra de escena).
- Lienzo solo-cuerpo 64×56, pies en la fila 55 (fila de suelo), personaje centrado. El lienzo
  heredado 97×59 se retira (ver "tras la aprobación").
- Debe leerse como Kratos: calvo, marca roja, piel gris ceniza, barba, cicatrices, antebrazos
  vendados, taparrabos. El criterio es que la pose se entienda, no solo que compile.

REGLA DURA (D-31)
Ningún script, función o bucle puede generar o modificar el contenido de grids/*.txt. El .txt
se escribe con una herramienta de escritura de archivos, con las filas literales. Python se usa
SOLO para validar, rasterizar y previsualizar. Si te encuentras escribiendo `ellipse`,
`draw_line` o un bucle que rellena caracteres, detente: es el método archivado y prohibido.
Tampoco derivar el cuadro del master.txt heredado desplazando o cizallando bloques.

CÓMO TRABAJAR (docs/direccion.md §5)
1. Define primero los PUNTOS DE REFERENCIA del cuadro en grids/kratos/idle-00.landmarks.json
   (formato y ejemplo en la cabecera de scripts/check_landmarks.py): coordenadas (x, y) de
   coronilla, hombros, codos, manos, caderas, rodillas y pies, cada una con los roles de paleta
   que debe tener ese píxel (`roles` de palette/kratos.json) y `"ground": true` en los pies.
   No dibujan nada: fijan dónde cae cada parte. Valídalos tras cada pasada con:
     python3 scripts/check_landmarks.py grids/kratos/idle-00.landmarks.json
   En la pasada de silueta solo usa los roles `outline` y `skin_lit`.
2. Dibuja en TRES PASADAS, cada una es el cuadro completo, no un parche:
   a) SILUETA: 2 colores (contorno `o` y relleno `s`), solo proporciones y pose.
      >>> Muéstrasela a la usuaria y ESPERA su aprobación antes de seguir. <<<
   b) SOMBREADO: piel clara/media/sombra, cuero, tela, marca roja.
   c) CONTORNO Y DETALLE: vendas, cicatrices, barba, remates.
3. Después de cada pasada, bucle visual (máximo 3 rondas por pasada): rasteriza, MIRA la imagen
   ampliada, compara con tus puntos de referencia y con la lista de comprobación, y corrige.
     python3 scripts/preview_grid.py grids/kratos/idle-00.txt \
       --palette palette/kratos.json --ground-row 55 --scale 8 --out /tmp/idle-00.png
   Para comparar con el master heredado pasa dos grids y dos --palette. Usa las reglas de
   coordenadas para indicar posiciones ("codo en x=14, y=30"); no cuentes caracteres a ojo.
   Lista de comprobación: ¿cabeza, torso y piernas en proporción? ¿pies en la fila 55?
   ¿simetría razonable sin parecer calcada? ¿la marca roja y la barba se leen? ¿ningún
   píxel de cadena, cuchilla o sombra?
4. Valida con `pnpm art:check` y genera el PNG con `pnpm art`.
5. Muestra a la usuaria el cuadro ampliado junto al master.txt heredado como referencia y
   ESPERA su aprobación final. No conectes nada al juego antes.
6. NO hagas commit hasta la aprobación final (un cuadro = un commit).

SOLO TRAS LA APROBACIÓN FINAL
- Aplica el lienzo 64×56: "frame_size" y "anchors.ground" (55) en grids/kratos/manifest.json y
  PLAYER_SPRITE_WIDTH/HEIGHT en src/config.ts (única fuente).
- Retira master.txt, idle-01.txt y sus PNG heredados (kratos-neutral, kratos-idle-01), quita
  "master"/"master_png" del manifest y ajusta scripts/check_grid.py para no exigirlos.
- Conecta el cuadro en src/assets/manifest.ts (no dispersar this.load en ShellScene) como
  cuadro de idle.
- Enciende en src/config.ts presentation.restPose.enabled y presentation.playerShadow.enabled
  (estaban apagados porque el sprite viejo traía cuchillas y sombra cocidas) y ajusta sus
  offsets viendo el resultado. Revisa también los `hand` por movimiento (ART-02).
- Verifica en navegador real (Chrome headless por CDP): 0 errores de consola, 0 peticiones
  fallidas, y que el cuadro se vea bien en reposo, mirando a ambos lados y en el aire.
  `pnpm build` verde NO basta.
- Actualiza docs/estado.md en el mismo commit y cierra con el commit (convencional, sin
  atribución de IA).

NO TOQUES: la física, la simulación, el resto de arte, ni documentos fuera de los listados.
Los cambios a scripts/check_grid.py solo los que pide "tras la aprobación final". No hagas push.
