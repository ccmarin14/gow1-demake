# Lista del usuario del 2026-11-03 (prueba en celular), archivada

Cada punto que mandó el usuario tras probar en Firefox del celular, con lo que se hizo. Archivada desde `docs/estado.md`: todo quedó hecho o pasó a la lista de revisión del usuario.

Cada punto de la lista que mandó el usuario tras probar en Firefox del celular, con lo que se hizo. "Por ver" significa que las pruebas automáticas pasan pero el usuario todavía no lo probó; si algo sigue mal, va a su próxima lista.

| Punto del usuario | Qué se hizo | Estado |
| --- | --- | --- |
| □3 se siente corto de alcance | Alcance de 45 a 72 px (pista escalada 1,55 desde el hombro). | Hecho, por ver |
| □4 corto y sin efectos de color | Alcance de 73 a 87 px; estela más larga y destello como □2 y □3; arranca donde termina □3. | Hecho, por ver |
| □6 deja las espadas muy separadas al cerrar; con eso □ en el suelo queda cerrado | Las dos hojas terminan a 5,7 px una de otra (antes 21,6), cruzadas en X. | Hecho, por ver |
| □ aéreo 1 es muy bueno | Fijado con una prueba exacta (`tests/fixtures/air1-track.json`) para que no cambie. | Mantener |
| □ aéreo 2 corto | Alcance de la hoja lejana de 33 a 86 px (la órbita pasa unos 112 px detrás de Kratos: forma muy distinta de la anterior, sin juzgar a ojo). | Hecho, por ver |
| No se ve un tercer □ aéreo | El simulador sí lo alcanza tocando □ cada 8, 12, 16 o 20 ticks (prueba en `tests/combat-feel.test.ts`); se le dio alcance 91 px y estela como al primero. | Hecho, por ver; si sigue sin verse, anotar cómo se toca |
| Después de atacar en el primer salto se podía saltar otra vez | Un ataque en el primer salto gasta el doble salto hasta aterrizar (D-40). Antes el usuario había pedido lo contrario por error de escritura y lo corrigió. | Hecho |
| △ de suelo: más atrás al inicio, color desde que las lanza, más lejos, chispas al suelo | Puntos 8 px más atrás; estela desde `pull`/`charge`; aterriza unos 20 px más lejos; chispas en el golpe al suelo (`ShellScene`). | Hecho, por ver |
| △ de carga media: más curva hacia adelante y que arriba se retraigan | Curva adelante (+12 px) y recogida inmediata de las espadas sin pausa/congelación en el aire al soltar triángulo; recall parte suavemente desde el ápice (s = 1). Ventana de reacción ampliada a ~370 ms (22 ticks de corte) para facilitar soltar sin saltar. | Hecho |
| △ largo: mal, hace un ataque adicional al saltar; debe ser el de carga media con Kratos saltando y suspendido | *Ascension* salta inmediatamente al terminar el corte ascendente sin pausa estática de espadas en el aire; suspensión de 30 ticks (gravedad 0,2) y caída. | Hecho |
| △ aéreo: más alcance y no debe golpear el suelo | La pista llega a unos 83 px (antes 39); sin impacto, sin fuego en el suelo, sin destello ni temblor (queda un polvo al aterrizar). | Hecho, por ver; el brazo se desvía hasta 62° de la hoja en el lazo |
