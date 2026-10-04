# Beevo · beevo.co

La landing de Beevo. Sustituye a la lista de espera, que vivía en este mismo repositorio; se
construyó como `site-f/` en el repositorio de la aplicación, que sigue siendo donde se itera.

## De dónde sale

Propuesta para `beevo.co`, al lado de `../site`, `../site-b`, `../site-ai` y `../site-e`. Es el orden
de `../site-e` —portada, el porqué, el producto, Beevo AI, precios, preguntas y el cierre— vestido
como la lista de espera (`../waitlist`): el fondo en los rellenos del manual con su grano, los
titulares en Fraunces con la palabra importante sobre un trazo de marcador, las píldoras, el isotipo
que sigue al puntero y la cortina de tinta que se levanta al entrar.

```bash
npm run dev      # http://localhost:4321
```

Sitio estático, sin build: `index.html`, `styles.css`, `i18n.js`, `main.js` y `assets/`. Hace falta
un servidor. Se despliega en Vercel desde este repositorio, sin build.

## De arriba abajo

1. **Portada**. El titular solo en el centro, sobre el brillo del color emparejado con el fondo, y el
   fondo pasando por menta, lavanda, amarillo y rosa mientras se mira. El trazo de «project manager»
   va **del color del fondo**: iba del color del brillo, que es lo que tiene detrás, y no se veía.
   Arriba, el logotipo, el notch y los dos botones, nada más. Hubo alrededor del titular una flor,
   luego unas notas flotando y luego a Beevo hablando desde el notch: las tres ensuciaban la portada.
2. **El porqué**: una sola frase grande, «Un freelancer pierde 204 horas al año en papeleo: más de
   cinco semanas de trabajo. Beevo existe para devolvértelas.», con su fuente (Smallpdf, Freelancer
   Freedom Index 2026). Sus palabras nacen apagadas y se llenan de tinta al ritmo del scroll
   (`setupFill`), y el trazo de la cifra se dibuja cuando le llega el turno. Fue una fila de
   herramientas que se tachaban y después una escena en la que volaban al notch: la primera se pasaba
   de largo y la segunda cargaba la página.
3. **El producto**: la tarjeta grande con los pasos a un lado y la demo al otro, fija mientras se
   recorren las cinco escenas —Clientes, Equipo, proyecto compartido, cuentas de cobro automáticas y
   Beevo AI—. La mascota asoma por encima de la demo y, al bajar, se mete en su notch.
4. **Beevo AI**, el panel en el casi negro del manual: el titular, lo que conoce, tres cosas que se le
   piden y, al otro lado, Beevo en el centro con lo que conoce de tu estudio en arcos a su alrededor.
   **Mide lo que la pantalla debajo de la barra** y lo de dentro se mide con ella, así que se ve
   entero sin bajar. A los pies de Beevo va el dock de **Personalízalo**: cinco Beevos, y elegir uno
   viste al del centro y al del notch. Fue una franja aparte debajo («Hazlo tuyo»), que sonaba raro y
   hacía que el panel pidiera pantalla y media. En un teléfono las preguntas van en una fila que se
   desliza y la órbita se aplana, y también cabe.
5. **Precios**: «Un project manager por el precio de dos lattes al mes». Dos lattes de cafetería cuestan
   más o menos lo que el plan Solo en pesos, euros y dólares; se dice «lattes» y no una marca.
6. **Preguntas** y 7. **el cierre**.

## El notch es el menú

La barra lleva el logotipo y los botones de entrar y empezar, **sin fondo**, y se va al bajar y vuelve
al subir (`paintNav`): bajando se lee, subiendo se busca algo. **La navegación vive en el notch**, que
está siempre arriba desde que baja al levantarse la cortina: Beevo y el icono que dice que se abre;
abierto, las cuatro secciones —con su color y una línea de qué hay— y los dos botones. No dice nada
más: estuvo hablando en la portada y narrando cada sección, y eran dos voces en una página donde la
demo ya tiene la suya, en su propio notch. Con el menú abierto, donde no caben a su lado, los botones
de la barra se apartan.

Los titulares de sección entran palabra a palabra por su ranura, como el de la portada, y su trazo se
dibuja al final (`setupRise`).

## El scroll

Suave, con **Lenis**. Y encima, un ajuste: al dejar de bajar, si una sección que cabe en la pantalla
quedó casi entera a la vista pero cortada, la página se desliza lo que falta para verla completa
(`setupSettle`, sobre lo marcado con `data-snap`). No frena: solo actúa con el scroll ya quieto, un
gesto nuevo lo interrumpe, sigue la dirección en la que se iba y hacia atrás solo corrige pasarse un
poco. Dentro del recorrido de la demo no hace nada, y lo que la página mueve sola (el menú, las
respuestas del notch) no lo dispara. Con «menos movimiento» no hay ni scroll suave ni ajuste.

## El idioma

No se elige: **lo dice el navegador**. El primero de sus idiomas que sea español o inglés manda, y si
no tiene ninguno de los dos, inglés. `?lang=es` o `?lang=en` lo fuerzan, que es lo que leen los
buscadores en las versiones de cada idioma (`hreflang`). El español vive en el HTML; el inglés y lo
que no está en el HTML, en `i18n.js`.

## Lo que se decide antes de publicar

Arriba de `main.js`:

- `APPS_LIVE` (falso): mientras las apps no estén en las tiendas, la pregunta del celular dice que
  llegan muy pronto. Al publicarlas, `true`.
- Y como todos los botones llevan a `/registro`, el registro tiene que estar abierto
  (`SIGNUPS_OPEN=true`) el día que esto se publique.

## Piezas

- **Colores: los seis del manual** y nada más. El fondo y su brillo van en pareja (menta con
  lavanda, lavanda con menta, amarillo con rosa, rosa con amarillo); los grises salen del casi negro.
- **Tipografía**: la página en la Neulis de la marca (`Neulis-Light.otf`, la de las letras de gancho,
  como la lista de espera); lo que imita al producto —la demo, el notch— en la de letras de siempre
  (`NeulisAlt-Light.otf`). Los titulares en Fraunces.
- **El isotipo no gira** ni se deforma: el cursor y la cortina lo mueven y lo escalan, nada más.
- **Textos**: para Colombia y España a la vez. Nada de «brief» ni «iguala»: se dice PDF y cuentas de
  cobro. Las cifras de fuera llevan su fuente al lado; no se inventa ninguna.
- **Movimiento**: GSAP + ScrollTrigger y Lenis, vendorizados en `assets/vendor`. El único pin es el
  del recorrido del producto.
- **Precios**: copiados de `Billing::Plan`. La moneda la decide el país, con la regla del Rails
  (`https://app.beevo.co/precios/moneda`, y si no contesta, se adivina en el navegador).

Comprobado en 1440×900, 1366×700, 1100×800, 1024×768, 820×1180, 760, 721, 390×844, 360×740 y
320×640, en español y en inglés y con «menos movimiento», sin desborde lateral ni errores en consola.
