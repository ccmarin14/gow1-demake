# Registro de decisiones vigentes

Las decisiones históricas o reemplazadas de ciclos anteriores se conservan en `archivo/docs/decisiones.md`.

| ID | Decisión | Motivo |
| --- | --- | --- |
| **D-01** | Usar Phaser 3.90.0, TypeScript y Vite sobre un lienzo lógico de 480×270 con escalado nearest-neighbor (antes D-01 y D-12). | Base ejecutable ligera con nitidez pixel art. |
| **D-03** | Adaptar la historia, los enemigos y el repertorio de combate del primer *God of War* (PS2) al plano lateral 2D, tomando *God of War: Betrayal* solo como referencia espacial (antes D-03, D-20 y D-24). | Combina la identidad y mecánicas de PS2 con una lectura lateral clara. |
| **D-04** | Crear todos los recursos visuales y sonoros como material original, sin copiar assets de los juegos de referencia. | Integridad del proyecto. |
| **D-08** | Mapear los controles de teclado a acciones de dominio separando ataque ligero (`J`), pesado (`K`), agarre (`L`), magia (`U`), guardia (`O`), esquiva (`Shift`) e interacción ambiental (`E`). | Evita colisiones de entrada entre combate y escenario. |
| **D-09** | Mantener la simulación determinista a 60 Hz en `src/sim/` desacoplada de Phaser, y exponer `window.__GOW8B` en modo desarrollo (antes D-09, D-10 y D-16). | Permite inspeccionar y reproducir estados sin acoplar las reglas al renderizador. |
| **D-25** | Los sprites de personajes tienen como única fuente de verdad los grids de texto en `grids/`; los PNG en `public/assets/characters/` son artefactos derivados con `scripts/ascii_to_png.py`. | Permite versionar, revisar y editar cada píxel en texto sin generadores vectoriales. |
| **D-26** | El sprite del personaje dibuja únicamente su cuerpo; armas encadenadas, estelas y sombras se renderizan en capas separadas del motor. | Evita doble cadena con `WeaponLayer` y sombras flotantes en el aire. |
| **D-28** | Trabajar en pasos pequeños de un cuadro o un ajuste verificable por vez, con un único documento de estado (`docs/estado.md`) actualizado en el mismo commit y aprobación visual directa de la usuaria. Reemplaza el esquema de 3 roles con auditoría formal por tarea y las derivaciones por cizalla/rotación. | Elimina la burocracia documental y los cuadros deformados por scripts. |
