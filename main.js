/* ───────────────────────────────────────────────────────────
   Beevo · lista de espera
   Una sola pantalla. Sin dependencias: todo es CSS + rAF.
   ─────────────────────────────────────────────────────────── */

/* Dónde se mandan los correos: a la aplicación (`WaitlistSignupsController`),
   que los guarda y los enseña en /admin. Un POST con `{ email, website }` en
   JSON; `website` es la trampa para robots, un campo que una persona no ve.
   En local se manda al Rails de desarrollo, para no apuntar correos de
   prueba en la lista de verdad. Vacío = modo local: se guardan en el
   navegador y la confirmación funciona igual. */
const ENDPOINT = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3010/lista-de-espera/apuntarse"
  : "https://app.beevo.co/lista-de-espera/apuntarse";

/* Día de apertura: el lunes 5 de octubre, a medianoche en Colombia. La chapa de
   arriba es la cuenta atrás: "8d 12h 10m 38s". Vacío, se queda con lo que
   diga el HTML. */
const LAUNCH_AT = "2026-10-05T00:00:00-05:00";

/* Todo lo que la página dice, en sus dos idiomas. En el HTML va el español,
   que es lo que se lee sin JavaScript; cada texto lleva su clave en
   `data-i18n` (y los atributos, en `data-i18n-attr="placeholder:clave"`).

   `who` es quién usa Beevo, en el hueco de "Tu ___ no se maneja solo…". La
   letra es el final de "solo": una agencia no se maneja "sola". Solo en
   singular: un plural cambiaría también "Tu" y "maneja". En inglés no hay
   concordancia —"itself" acaba siempre en f—, pero las dos listas miden
   lo mismo, así que al cambiar de idioma la palabra sigue en su sitio. */
const TEXT = {
  es: {
    "meta.title": "Beevo — Tu negocio no se maneja solo… ¿o sí?",
    "meta.description": "Beevo llega pronto: clientes, proyectos, tareas, calendario y facturas en un solo sitio. Apúntate a la lista y entra antes que nadie.",
    "lang.label": "Idioma",
    "soon": "5 de octubre",
    "soon.here": "Ya estamos aquí",
    "title.label": "Tu negocio no se maneja solo… ¿o sí?",
    "title.your": "Tu",
    "title.runs": "no se maneja",
    "title.alone": "sol",
    "title.wink": "¿o sí?",
    "lede": "Beevo es el espacio donde organizas todo lo que mueve tu trabajo creativo y profesional: tus clientes, proyectos, tareas, calendario y facturas.",
    "join.title": "Únete a la lista.",
    "join.label": "Tu correo",
    "join.placeholder": "tu@correo.com",
    "join.button": "Apuntarme",
    "join.small": "Solo te escribiremos para avisarte cuando Beevo abra.",
    "join.invalid": "Ese correo no parece un correo. Míralo otra vez.",
    "join.failed": "No hemos podido apuntarte. Inténtalo en un momento.",
    "legal.privacy": "Política de privacidad",
    "legal.privacyHref": "/privacidad",
    "legal.terms": "Condiciones",
    "done.title": "Ya estás dentro.",
    "done.body": "Te avisamos en",
    who: [
      ["negocio", "o"],
      ["estudio", "o"],
      ["agencia", "a"],
      ["productora", "a"],
      ["agenda", "a"],
      ["equipo", "o"],
      ["marca", "a"],
      ["facturación", "a"],
    ],
  },
  en: {
    "meta.title": "Beevo — Your business doesn’t run itself… or does it?",
    "meta.description": "Beevo is coming soon: clients, projects, tasks, calendar, and invoices in one place. Join the list and get in before anyone else.",
    "lang.label": "Language",
    "soon": "October 5",
    "soon.here": "We’re here",
    "title.label": "Your business doesn’t run itself… or does it?",
    "title.your": "Your",
    "title.runs": "doesn’t run",
    "title.alone": "itsel",
    "title.wink": "or does it?",
    "lede": "Beevo is the place where you organize everything that keeps your creative and professional work moving: your clients, projects, tasks, calendar, and invoices.",
    "join.title": "Join the list.",
    "join.label": "Your email",
    "join.placeholder": "you@email.com",
    "join.button": "Count me in",
    "join.small": "We’ll only email you to let you know when Beevo opens.",
    "join.invalid": "That doesn’t look like an email. Take another look.",
    "join.failed": "We couldn’t sign you up. Try again in a moment.",
    "legal.privacy": "Privacy policy",
    "legal.privacyHref": "/privacy",
    "legal.terms": "Terms",
    "done.title": "You’re in.",
    "done.body": "We’ll let you know at",
    who: [
      ["business", "f"],
      ["studio", "f"],
      ["agency", "f"],
      ["practice", "f"],
      ["calendar", "f"],
      ["team", "f"],
      ["brand", "f"],
      ["invoicing", "f"],
    ],
  },
};
const LANGS = Object.keys(TEXT);
const LANG_KEY = "beevo:lang";
const WHO_EVERY = 2400;

/* El idioma: el que pida la dirección (`?lang=en`), si no el que se eligió
   aquí otra vez, y si no el del navegador —el primero de sus idiomas que
   sea español o inglés—. Todo lo demás, español. */
function pickLang() {
  const asked = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(asked)) return asked;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {} // sin almacenamiento (privado, bloqueado): se decide por el navegador
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || ""];
  const first = prefs.map((l) => l.toLowerCase()).find((l) => l.startsWith("en") || l.startsWith("es"));
  return first?.startsWith("en") ? "en" : "es";
}
let lang = pickLang();
const t = (key) => TEXT[lang][key] ?? TEXT.es[key] ?? key;

/* Cuánto dura cada color antes de pasar al siguiente. */
const THEMES = ["mint", "lilac", "yellow", "pink"];
const THEME_EVERY = 5200;

const quiet = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hover = matchMedia("(hover: hover)").matches;
const lerp = (a, b, t) => a + (b - a) * t;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── 1. letras ───────────────────────────────────────────── */
/* Las letras van agrupadas por palabra. Sueltas, cada letra es una caja
   aparte y el navegador puede partir el renglón entre dos de ellas, en
   mitad de una palabra. */
/* Se parten al aplicar el idioma (sección 9), que es quien sabe qué texto
   les toca; al cambiar de idioma se vuelven a partir. */
function split(el, text) {
  el.textContent = "";
  let i = 0;
  text.split(" ").forEach((word, w) => {
    if (w) el.append(" ");
    const box = document.createElement("span");
    box.className = "w";
    [...word].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "char";
      c.textContent = ch;
      c.style.transitionDelay = `${i++ * 24}ms`;
      box.appendChild(c);
    });
    el.appendChild(box);
  });
}

/* ── 2. entrada ──────────────────────────────────────────── */
/* Es una sola pantalla: no hay nada que esperar a que entre en vista, así
   que todo se revela en cadena al levantarse la cortina. */
function open() {
  requestAnimationFrame(() => document.body.removeAttribute("data-loading"));
  const pieces = $$("[data-split],[data-swap],[data-swap-end]");
  pieces.forEach((el, i) => setTimeout(() => el.classList.add("is-in"), 900 + i * 120));
  $$("[data-reveal]").forEach((el, i) => setTimeout(() => el.classList.add("is-in"), 1250 + i * 90));
  if (!quiet) {
    setTimeout(startThemes, 2600);
    setTimeout(startWho, 2600);
  }
}
if (document.readyState === "complete") setTimeout(open, 260);
else addEventListener("load", () => setTimeout(open, 260));

/* ── 3. el color va cambiando ────────────────────────────── */
const body = document.body;
const themeMeta = $('meta[name="theme-color"]');
let themeIndex = 0;
let themeTimer = null;

function setTheme(name) {
  body.dataset.theme = name;
  const hex = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  if (themeMeta && hex) themeMeta.content = hex;
}

function startThemes() {
  stopThemes();
  themeTimer = setInterval(() => {
    themeIndex = (themeIndex + 1) % THEMES.length;
    setTheme(THEMES[themeIndex]);
  }, THEME_EVERY);
}
function stopThemes() {
  clearInterval(themeTimer);
  themeTimer = null;
}

/* Mientras escribes el correo, la página se queda quieta: que el fondo
   cambie de color debajo de lo que estás tecleando distrae justo ahí. */
const form = $("[data-form]");
form.addEventListener("focusin", stopThemes);
form.addEventListener("focusout", () => { if (!quiet) startThemes(); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopThemes();
  else if (!quiet && !form.contains(document.activeElement)) startThemes();
});

/* ── 3b. quién ───────────────────────────────────────────── */
const swap = $("[data-swap]");
const swapEnd = $("[data-swap-end]");
let whoIndex = 0;

/* Cambia el contenido de un hueco: lo viejo sube y se va, lo nuevo sube
   desde abajo. El ancho del hueco se anima de una palabra a la otra, así
   que lo que va detrás se aparta en vez de saltar. */
function roll(slot, text) {
  const old = slot.querySelector(".swap__in.is-on");
  if (old && old.textContent === text) return;

  const next = document.createElement("span");
  next.className = "swap__in";
  next.textContent = text;
  slot.appendChild(next);

  slot.style.width = `${next.getBoundingClientRect().width}px`;
  requestAnimationFrame(() => {
    next.classList.add("is-on");
    if (old) {
      old.classList.remove("is-on");
      old.classList.add("is-out");
      setTimeout(() => old.remove(), 900);
    }
  });
}

/* El hueco nace con su palabra como texto llano; se envuelve una vez y se
   le fija el ancho, que no se puede animar desde "auto". La palabra es la
   del idioma elegido: en el HTML solo está la española. */
function prime(slot, text) {
  slot.textContent = "";
  const first = document.createElement("span");
  first.className = "swap__in is-on";
  first.textContent = text;
  slot.appendChild(first);
  slot.style.width = `${first.getBoundingClientRect().width}px`;
}

function fitSwaps() {
  [swap, swapEnd].forEach((slot) => {
    const on = slot.querySelector(".swap__in.is-on");
    if (on) slot.style.width = `${on.getBoundingClientRect().width}px`;
  });
}

prime(swap, t("who")[whoIndex][0]);
prime(swapEnd, t("who")[whoIndex][1]);
/* Con la fuente de verdad cargada las palabras miden otra cosa. */
document.fonts?.ready.then(fitSwaps);
addEventListener("resize", fitSwaps);

let whoTimer = null;
function startWho() {
  clearInterval(whoTimer);
  whoTimer = setInterval(() => {
    const who = t("who");
    whoIndex = (whoIndex + 1) % who.length;
    const [word, end] = who[whoIndex];
    roll(swap, word);
    roll(swapEnd, end);
  }, WHO_EVERY);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInterval(whoTimer);
  else if (!quiet) startWho();
});

/* ── 4. cursor y botones magnéticos ──────────────────────── */
const cursor = $(".cursor");
const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
const dot = { ...pointer };
const mouse = { x: 0, y: 0 };
const eased = { x: 0, y: 0 };

addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  mouse.x = e.clientX / innerWidth - 0.5;
  mouse.y = e.clientY / innerHeight - 0.5;
  cursor.classList.add("is-on");
});
addEventListener("pointerleave", () => cursor.classList.remove("is-on"));

if (!quiet && hover) {
  $$("[data-cursor]").forEach((el) => {
    const kind = el.dataset.cursor;
    el.addEventListener("pointerenter", () => cursor.classList.add(`is-${kind}`));
    el.addEventListener("pointerleave", () => cursor.classList.remove(`is-${kind}`));
  });
  $$("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.4;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

/* ── 5. la flor mira hacia el puntero ────────────────────── */
const flower = $("[data-flower]");

function frame() {
  dot.x = lerp(dot.x, pointer.x, 0.19);
  dot.y = lerp(dot.y, pointer.y, 0.19);
  cursor.style.transform = `translate(${dot.x}px, ${dot.y}px)`;

  eased.x = lerp(eased.x, mouse.x, 0.05);
  eased.y = lerp(eased.y, mouse.y, 0.05);
  flower.style.transform =
    `translate3d(${eased.x * 28}px, ${eased.y * 22}px, 0) ` +
    `rotateY(${eased.x * 22}deg) rotateX(${eased.y * -18}deg)`;

  requestAnimationFrame(frame);
}
if (!quiet && hover) requestAnimationFrame(frame);

/* ── 6. cuenta atrás ─────────────────────────────────────── */
/* La chapa mide lo que mide su texto, y el texto cambia: de la fecha a la
   cuenta, de "10d" a "9d", y el último día pierde los días. El hueco lleva un
   ancho **escrito** que se anima de uno a otro (como el de la palabra que
   rota), y solo se toca cuando de verdad cambia: la chapa encoge, no salta. */
const soon = $("[data-soon]");
const soonText = $("[data-soon-text]");
const launch = LAUNCH_AT ? new Date(LAUNCH_AT) : null;
const pad = (n) => String(n).padStart(2, "0");
let soonWidth = 0;

function fitSoon(animate = true) {
  const width = Math.ceil(soonText.getBoundingClientRect().width * 100) / 100;
  if (!width || Math.abs(width - soonWidth) < 0.5) return;
  soonWidth = width;
  // La primera medida se pone sin animar: no hay un ancho anterior del que venir.
  soon.classList.toggle("is-still", !animate || quiet);
  soon.style.width = `${width}px`;
}

/* Los números de Neulis no miden lo mismo —el 1 es la mitad que el 0— y
   `tabular-nums` no le hace nada: escrita tal cual, la chapa temblaba cada
   segundo. Cada dígito va en una celda del mismo ancho, y solo se reescribe la
   celda que cambia. Así el ancho se mueve cuando cambia **cuántas** cifras
   hay, que es lo que anima `fitSoon`. */
function writeSoon(text) {
  const cells = [...soonText.children];
  if (cells.length !== text.length) {
    soonText.replaceChildren(...[...text].map((ch) => {
      const cell = document.createElement("span");
      if (/\d/.test(ch)) cell.className = "soon__digit";
      cell.textContent = ch;
      return cell;
    }));
    return;
  }
  [...text].forEach((ch, i) => { if (cells[i].textContent !== ch) cells[i].textContent = ch; });
}

function paintSoon() {
  let s = Math.max(0, Math.floor((launch - Date.now()) / 1000));
  if (s === 0) {
    soonText.textContent = t("soon.here");
  } else {
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600);  s -= h * 3600;
    const m = Math.floor(s / 60);    s -= m * 60;
    // Sin días, la chapa no dice "0d": se acorta, y el ancho la acompaña.
    writeSoon(`${d ? `${d}d ` : ""}${pad(h)}h ${pad(m)}m ${pad(s)}s`);
  }
  fitSoon();
}
const counting = Boolean(launch && !isNaN(launch));
if (counting) {
  // Quien no ve la pantalla oye la fecha una vez, no una cifra nueva cada segundo.
  soon.setAttribute("aria-label", t("soon"));
  soonText.setAttribute("aria-hidden", "true");
  fitSoon(false);
  paintSoon();
  setInterval(paintSoon, 1000);
  // La letra de la marca llega después del primer pintado y no mide lo mismo.
  document.fonts?.ready.then(() => fitSoon());
}

/* ── 8. formulario ───────────────────────────────────────── */
const msg = $("[data-msg]");
const joinBox = $("[data-join]");
const done = $("[data-done]");
const burst = $("[data-burst]");
const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* Lo que dice la página se apunta por su clave, para poder repetirlo en el
   otro idioma si se cambia con el mensaje puesto. Lo que dice el servidor
   llega ya escrito y se queda como vino. */
let msgKey = null;
function say(text, error = false) {
  msgKey = null;
  msg.textContent = text;
  msg.classList.toggle("is-on", Boolean(text));
  form.classList.toggle("is-error", error);
  if (error) setTimeout(() => form.classList.remove("is-error"), 600);
}
function sayKey(key, error = false) {
  say(t(key), error);
  msgKey = key;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();

  if (!valid(email)) {
    sayKey("join.invalid", true);
    form.email.focus();
    return;
  }

  form.classList.add("is-busy");
  say("");

  try {
    if (ENDPOINT) {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        // El idioma viaja con el correo, para escribirle a cada quien en el suyo el día que abra.
        body: JSON.stringify({ email, website: form.website.value, locale: lang }),
      });
      if (!res.ok) {
        // Lo que el servidor sabe decir —ese correo no vale, demasiados intentos— se dice con
        // sus palabras; lo demás cae en el "no hemos podido" de abajo.
        const problem = await res.json().catch(() => null);
        if (problem?.error) { say(problem.error, true); return; }
        throw new Error(res.status);
      }
    } else {
      const list = JSON.parse(localStorage.getItem("beevo:waitlist") || "[]");
      if (!list.includes(email)) list.push(email);
      localStorage.setItem("beevo:waitlist", JSON.stringify(list));
      await new Promise((r) => setTimeout(r, 700));
    }

    $("[data-done-mail]").textContent = email;

    joinBox.hidden = true;
    done.hidden = false;

    if (!quiet) {
      burst.classList.remove("is-on");
      void burst.offsetWidth; // reinicia la animación
      burst.classList.add("is-on");
      flower.classList.add("is-happy");
      setTimeout(() => flower.classList.remove("is-happy"), 1400);
      startThemes();
    }
  } catch {
    sayKey("join.failed", true);
  } finally {
    form.classList.remove("is-busy");
  }
});

/* ── 9. idioma ───────────────────────────────────────────── */
/* Cambiar de idioma no recarga: reescribe en su sitio cada texto con su
   clave, el título de la pestaña, la descripción y `<html lang>`. Lo que
   va partido en letras se vuelve a partir y entra otra vez, y la palabra
   que rota cambia por su gemela en el otro idioma. */
const description = $('meta[name="description"]');
const langButtons = $$("[data-lang]");

function applyLang(next) {
  lang = next;
  document.documentElement.lang = lang;
  document.title = t("meta.title");
  description?.setAttribute("content", t("meta.description"));

  $$("[data-i18n]").forEach((el) => {
    const text = t(el.dataset.i18n);
    if (!el.hasAttribute("data-split")) { el.textContent = text; return; }
    // Si ya había entrado, entra otra vez: se quita, se parte y se vuelve a poner.
    const shown = el.classList.contains("is-in");
    el.classList.remove("is-in");
    split(el, text);
    if (shown) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-in")));
  });
  // `data-i18n-attr="placeholder:join.placeholder; aria-label:otra"`
  $$("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  const [word, end] = t("who")[whoIndex];
  roll(swap, word);
  roll(swapEnd, end);

  if (counting) {
    soon.setAttribute("aria-label", t("soon"));
    paintSoon(); // el paso genérico acaba de poner la fecha encima de la cuenta
  }
  if (msgKey) msg.textContent = t(msgKey);

  langButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const next = button.dataset.lang;
    if (next === lang) return;
    applyLang(next);
    try { localStorage.setItem(LANG_KEY, next); } catch {}
    // Si la dirección pedía un idioma, ahora pide este: recargar no lo deshace.
    const url = new URL(location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", next);
      history.replaceState(history.state, "", url);
    }
  });
});

applyLang(lang);
