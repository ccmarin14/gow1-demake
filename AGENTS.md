# Guía de trabajo para agentes

## Propósito del proyecto

Juego de acción lateral 2D hecho con **Phaser 3.90.0**, **TypeScript** y **Vite** (resolución lógica 480×270). Combina la historia, los enemigos y el repertorio de combate del primer *God of War* (PlayStation 2) con el encuadre lateral y la lectura en pixel art de *God of War: Betrayal*.

## Documentación vigente

- **[`docs/estado.md`](docs/estado.md):** único documento de estado medido (qué funciona, problemas abiertos, siguiente paso y registro de cambios). Léelo siempre antes de empezar y actualízalo en el mismo commit de cada cambio.
- **[`docs/direccion.md`](docs/direccion.md):** dirección creativa, mapa de controles y guía visual.
- **[`docs/decisiones.md`](docs/decisiones.md):** decisiones vigentes.
- **[`docs/arquitectura.md`](docs/arquitectura.md):** separación entre simulación (`src/sim/`) y presentación Phaser (`src/scene/`).
- **Historial retirado:** el material viejo (planes, scripts procedurales y arte descartado) solo vive en el historial de git (`git show c2e8729:archivo/`). No lo uses como referencia del estado actual.

## Flujo de trabajo

1. **Unidades chicas y revisables:** cada paso aborda un único cambio acotado (por ejemplo, un cuadro de animación en ASCII o la corrección de un defecto puntual).
2. **Juego siempre ejecutable:** al cerrar cada paso, `pnpm build` y `pnpm test` deben pasar y el juego debe cargar en navegador sin errores de consola ni peticiones 404.
3. **Aprobación visual directa:** en tareas de arte o animación, muestra el cuadro ampliado junto al cuadro de referencia (y en el navegador cuando se conecte al juego) y espera la aprobación de la usuaria antes de avanzar al siguiente cuadro. Un cuadro se commitea solo después de aprobado (un cuadro = un commit, con su línea en `docs/estado.md`); mientras está en revisión queda sin commitear. Los cuadros nuevos parten de `idle-00` como modelo del personaje. Si la usuaria no puede revisar en el momento, el cuadro se commitea igual y se anota en "Revisiones pendientes" de `docs/estado.md`; si después lo rechaza, se corrige en un commit nuevo. Ningún cuadro nuevo parte de uno pendiente: mientras haya revisiones pendientes se avanza en trabajo verificable sin ojo humano (simulación, harness, código).
4. **Lo heredado no es requisito:** la tabla "Mecánicas heredadas" de `docs/estado.md` lista lo que implementaron agentes anteriores sin que la usuaria lo decidiera. Antes de dibujar arte para una de ellas, ampliarla o tomarla como base de un plan, pregunta si la quiere. Una mecánica pasa a "Verificada" solo con pruebas en `pnpm test`.
5. **Sin burocracia:** no crees planes extensos por etapa, ni archivos de auditoría separados, ni documentos nuevos fuera de los cuatro listados arriba. Única excepción: `docs/temporal/` guarda el brief de la tarea en curso para otro agente (uno por tarea); se borra en el mismo commit que cierra la tarea. Registra una línea en `docs/estado.md` por cada paso completado.
6. **Imágenes de trabajo dentro del proyecto:** las vistas previas, comparaciones y guías de pose van en `docs/tmp/` (ignorada por git), nunca en `/tmp` del sistema, para que la usuaria pueda abrirlas.

## Reglas de arte y animación (ASCII → PNG)

- **ASCII semántico como fuente de verdad:** los sprites de personajes viven en `grids/` como texto plano donde cada letra representa un material o rol de color claro en `palette/` y `.` es transparencia. El PNG se genera con `pnpm art` (usa `scripts/ascii_to_png.py`) y nunca se edita a mano; `pnpm art:check` valida los grids.
- **Método de dibujo para agentes:** sigue `docs/direccion.md` §5. Las animaciones arrancan como borrador renderizado del maniquí 3D (D-34) y se terminan a mano; fuera de ese borrador, ningún script escribe en `grids/*.txt`.
- **Dibujo directo, sin deformación por scripts:** cada cuadro se dibuja en su grid manteniendo el mismo modelo anatómico del personaje. Queda prohibido generar humanoides con trazos vectoriales procedurales (`draw_limb_segment`, polígonos) o derivar cuadros trasladando/cizallando bloques por script.
- **Cada cuadro es una pose completa:** todo el cuerpo cambia con el movimiento (cabeza, hombros, torso, brazos, cadera y piernas). Prohibido componer un cuadro pegando partes de otro, a mano o por script (por ejemplo, el torso de `idle-00` sobre piernas nuevas): se ve cortado en la cadera y rígido arriba, y la usuaria lo rechazó. Única excepción: la cabeza de `idle-00`, que es rígida, se reutiliza en la terminación de cada cuadro para que la cara sea siempre la misma.
- **Separación de capas:** el grid del personaje solo contiene su cuerpo y vestimenta. Las cadenas, las hojas extendidas y la sombra de contacto se renderizan en capas separadas del motor (`WeaponLayer` y sombra en escena).
- **Chequeos básicos de cada cuadro** (los ejecuta `pnpm art:check`): dimensiones exactas declaradas para el personaje, solo caracteres presentes en su paleta, alfa binario (`0` o `255`) y pies apoyados en la fila de suelo en las poses terrestres.

## Lecciones clave a preservar

- **`tsc` y `pnpm build` no verifican el juego:** un build en verde no detecta texturas 404 ni animaciones rotas. Verifica en navegador real (Chrome DevTools MCP o Chrome headless por CDP) que la consola y la red estén limpias.
- **Fidelidad de píxel no equivale a calidad visual:** comprobar que un PNG se dibuja idéntico a sí mismo no dice si la pose se entiende. El juicio estético requiere mostrar la imagen ampliada a la usuaria.
- **No mezclar carga de assets:** registra las texturas en `src/assets/manifest.ts` en lugar de dispersar llamadas `this.load` en `ShellScene.ts`.
