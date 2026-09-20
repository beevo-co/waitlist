# Beevo · lista de espera

**Una sola pantalla**, de expectativa, al estilo de rikkko.com: la marca y la cuenta atrás
arriba, la flor en medio, la promesa abajo a la izquierda y el correo abajo a la derecha.
Es lo que está en el aire hasta que Beevo abra. La página completa, para el lanzamiento,
está en `../landing`.

Sitio estático: **sin build, sin dependencias, sin CDN**. `index.html`, `styles.css`,
`main.js` y `assets/`. Moverlo es copiar la carpeta.

```bash
npm run dev      # http://localhost:4321
```

Hace falta un servidor (cualquiera): `main.js` es un módulo ES y `file://` los bloquea.

## Dónde vive

**Esta carpeta se sube a Vercel; la aplicación (el Rails) va a Heroku.** Son dos despliegues que
no comparten nada: esto es HTML, CSS y un módulo de JavaScript, sin build. Lo único que los une
es que el formulario manda el correo a la aplicación (`ENDPOINT`, más abajo).

En Vercel: importar el repositorio, **Root Directory = `waitlist`**, Framework Preset = *Other*,
y dejar vacíos el comando de build y el directorio de salida. `vercel.json` pone la caché de
`assets/` (un día: los ficheros no llevan huella en el nombre, así que un año los dejaría
pegados) y quita el `.html` de las direcciones. O desde esta carpeta, `npx vercel --prod`.

**El dominio desde el que se sirva tiene que estar en la lista de la aplicación**
(`WAITLIST_ORIGINS`, en Heroku): por defecto `https://beevo.co` y `https://www.beevo.co`. Si
no, el correo **se guarda igual** pero el navegador no deja leer la respuesta y la página dice
"no hemos podido apuntarte". Para las direcciones de prueba de Vercel, que cambian en cada
despliegue, vale un comodín: `https://beevo-waitlist-*.vercel.app`.


## Lo que se configura

Todo arriba del todo en `main.js`:

| constante | qué hace |
|---|---|
| `ENDPOINT` | A dónde van los correos: `https://app.beevo.co/lista-de-espera/apuntarse`, que es el Rails (`WaitlistSignupsController`); se miran y se exportan en `/admin`. `POST` con `{ email, website }` en JSON — `website` es la trampa para robots, un campo escondido del formulario. **En `localhost` se manda al Rails de desarrollo** (`http://localhost:3010`), para no apuntar correos de prueba en la lista de verdad. El Rails solo deja leer la respuesta a los dominios de su lista (`WAITLIST_ORIGINS`, por defecto `beevo.co` y `www.beevo.co`): si la página se sirve desde otro, hay que añadirlo allí. Vacío: los correos se quedan en el navegador y la confirmación funciona igual. |
| `LAUNCH_AT` | El día de apertura (`"2026-09-28T00:00:00+02:00"`, medianoche en Madrid): la chapa de arriba es la cuenta atrás, "8d 12h 10m 38s". El ancho de la chapa **se anima** cuando el texto cambia de tamaño (al perder un dígito, o al pasar de la fecha a la cuenta), en vez de saltar. Vacío, se queda con lo que diga el HTML: "28 de septiembre". |
| `THEMES`, `THEME_EVERY` | Los colores por los que pasa la página y cuánto dura cada uno. |

## La frase

> **Tu negocio no se maneja solo… ¿o sí?**
> Beevo es el espacio donde organizas todo lo que mueve tu trabajo creativo y profesional.
>
> El título hace la pregunta y el subtítulo **dice qué es Beevo**, en una sola frase. Fue
> "Sal y tómate un cafecito…", que contestaba al "¿o sí?" con gracia pero no decía qué es el
> producto. No dice "negocio": la palabra del título ya va rotando justo para no limitarlo a eso.

**La palabra va cambiando** por quien usa Beevo: negocio, estudio, agencia, productora,
agenda, equipo, marca, facturación. Cada 2,4 s, subiendo la vieja y entrando la nueva desde
abajo, y el ancho del hueco se anima de una a otra para que lo de al lado se aparte en vez
de saltar. La lista está en `WHO`, arriba de `main.js`.

**Y "solo" concuerda con ella**: la agencia no se maneja *sola*. Cada palabra lleva su
final (`["agencia", "a"]`) y la última letra de "solo" rota a la vez, solo cuando cambia.
Por eso la lista es **solo de singulares**: un plural obligaría a cambiar también "Tu" y
"maneja", y eso ya es otra frase moviéndose.

La palabra va sobre un **trazo de marcador del color del brillo**, que es el que rota con
el fondo, así que la marca cambia de color con la página. "¿o sí?" lleva el eje `WONK` de
Fraunces encendido: las mismas letras con un punto de guasa.

Son tres renglones fijos y la palabra va sola en el primero: así, cuando cambia de largo,
no empuja nada al renglón de abajo. Medido en 375 px con las ocho palabras: un renglón por
línea, nada se sale y la página sigue cabiendo en una pantalla.

**Las letras se parten agrupadas por palabra.** Sueltas, cada letra es una caja aparte y
el navegador puede cortar el renglón entre dos de ellas, en mitad de una palabra.

**La rotación, como el cambio de color, se para con la pestaña en segundo plano** y no
existe con `prefers-reduced-motion`, donde se queda "Tu negocio no se maneja solo".

**El título va en Fraunces y el texto en Neulis**, al revés que en la landing: Fraunces a
peso 500 y con el eje `SOFT` subido da un titular con cuerpo; Neulis se queda para lo que
se lee seguido. Lo mismo en el bloque del correo.

## Cómo está pensada

**Tres filas y la flor se queda con lo que sobra.** La pantalla es una rejilla —arriba,
la flor, abajo— y la flor ocupa el hueco del medio y nunca más, así que no puede montarse
encima del texto. En rikkko el personaje tapa medio titular; aquí eso ya se probó en el
hero de la landing y se leía como desorden.

**La página cambia de color sola.** Pasa por los cuatro rellenos claros del manual cada
cinco segundos, y cada fondo lleva su isotipo y su brillo emparejados exactamente como en
la página 10 del manual: menta con la flor lila, lila con la menta, amarillo con la rosa,
rosa con la amarilla. El casi negro y el crema no entran: el primero cambiaría la tinta de
todo y el segundo no se distingue del blanco del campo.

**Mientras escribes el correo, se para.** Que el fondo cambie de color debajo de lo que
estás tecleando distrae justo en el único momento que importa. También se para con la
pestaña en segundo plano.

**El brillo es color y no degradado.** Un `radial-gradient` no se anima entre dos colores
—salta—, así que el color va en `background-color` y la forma la pone una máscara.

**La flor mira hacia el puntero**: se inclina en 3D siguiéndolo, suavizado con `lerp`, y
flota sola cuando no hay ratón.

**Al apuntarse**, la flor da una vuelta y suelta ocho pétalos de colores.

**No hay contador de apuntados.** Lo hubo, con un número puesto a mano mientras no
hubiera backend; arriba a la derecha va ahora la cuenta atrás hasta el día de apertura, con la
misma letra que tenía el contador. Si algún día se quiere enseñar la cifra, que sea la de verdad.

Lo demás viene de la landing: la cortina de entrada, el titular letra a letra, el cursor
que es el propio isotipo, el botón magnético, el grano.

## Tamaños

**Siempre una sola pantalla, sin scroll**, en cualquier tamaño. La página mide lo que la
pantalla (`100svh`, la más pequeña: con la barra del navegador puesta tampoco rueda), y quien
encoge es la flor, que se queda con el alto que sobre.

- **Escritorio**: dos columnas abajo, la flor en medio.
- **Estrecho** (≤ 860 px): una columna, y la letra y los huecos de abajo se miden **en alto de
  pantalla** (`svh`). Se dejaba rodar "porque no cabía"; no cabía porque la flor tenía un alto
  fijo y la letra no miraba el alto. El campo y el botón van en una fila también en un teléfono.
- **Tumbado o muy bajo**: vuelve a las dos columnas —apilado no cabe en 375 px de alto— con la
  letra mirando el alto. Si ni así, lo primero que sobra es la nota de debajo del campo.

Comprobado sin scroll ni nada cortado en 320×568, 375×667, 390×844, 667×375, 768×1024 y 1440×900.

Con `prefers-reduced-motion` no se mueve nada, los colores no rotan y todo queda legible.
