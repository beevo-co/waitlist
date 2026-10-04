// Beevo · landing F: el CRM que trae su propio project manager.
//
// El orden de la landing E con la cara de la lista de espera: la cortina que se levanta, el fondo
// que va pasando por los rellenos del manual mientras se mira la portada, el brillo detrás del
// titular, el isotipo que sigue al puntero y las píldoras. Y lo de dentro, igual: **Beevo vive en la
// página como vive en el producto**: en su notch, arriba, que además es el menú. Y la mascota asoma
// por encima de la demo y, al bajar, se mete en el notch de la demo, que es donde habla.
//
// GSAP + ScrollTrigger para el movimiento y Lenis para el scroll suave, vendorizados en
// `assets/vendor`: nada de CDN.
(() => {
  "use strict"

  /* ── Lo que se decide antes de publicar ── */
  // Las apps de iPhone y Android: mientras no estén en las tiendas, la página no las promete.
  const APPS_LIVE = false

  const { gsap, ScrollTrigger, Lenis, BEEVO_I18N: I18N } = window
  const root = document.documentElement
  root.classList.add("js")
  gsap.registerPlugin(ScrollTrigger)

  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
  const lerp = (a, b, k) => a + (b - a) * k
  const easeOut = k => 1 - Math.pow(1 - k, 3)
  const easeInOut = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  const ICON = n => `<svg class="i"><use href="#i-${n}"/></svg>`
  const el = html => { const tpl = document.createElement("template"); tpl.innerHTML = html.trim(); return tpl.content.firstElementChild }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches
  const narrow = () => matchMedia("(max-width: 960px)").matches
  const nav = $("[data-nav]")

  // La flecha en cada botón que la pide: un chevrón que gana su palo al pasar por encima.
  const arrow = $("#arw")
  $$("[data-arw]").forEach(i => i.replaceWith(arrow.content.firstElementChild.cloneNode(true)))

  /* ── Idioma ──
     No se elige: lo dice el navegador. El primero de sus idiomas que sea español o inglés manda, y si
     no tiene ninguno de los dos, inglés. La dirección puede pedirlo (`?lang=en`), que es lo que leen
     los buscadores en las versiones de cada idioma (`hreflang`). El español vive en el HTML. */
  const original = new Map($$("[data-i18n]").map(n => [n, n.innerHTML]))
  const originalAria = new Map($$("[data-i18n-aria]").map(n => [n, n.getAttribute("aria-label")]))
  const originalLabel = new Map($$("[data-i18n-label]").map(n => [n, n.dataset.label]))
  const lang = (() => {
    const asked = new URLSearchParams(location.search).get("lang")
    if (asked === "es" || asked === "en") return asked
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || ""]
    const first = prefs.map(l => String(l).toLowerCase()).find(l => /^(es|en)\b/.test(l))
    return first?.startsWith("es") ? "es" : "en"
  })()
  const t = (k, vars) => {
    let s = I18N.words[lang][k] ?? k
    if (vars && typeof s === "string") for (const [a, b] of Object.entries(vars)) s = s.replace(`%{${a}}`, b)
    return s
  }

  function applyLang() {
    root.lang = lang
    original.forEach((es, node) => {
      const html = lang === "es" ? es : (I18N.en[node.dataset.i18n] ?? es)
      if (node.innerHTML !== html) node.innerHTML = html
    })
    originalAria.forEach((es, node) => node.setAttribute("aria-label", lang === "es" ? es : (I18N.en[node.dataset.i18nAria] ?? es)))
    originalLabel.forEach((es, node) => { node.dataset.label = lang === "es" ? es : (I18N.en[node.dataset.i18nLabel] ?? es) })
    document.title = t("meta.title")
    $('meta[name="description"]')?.setAttribute("content", t("meta.desc"))
    $$("[data-privacy]").forEach(a => a.setAttribute("href", t("privacy")))
    if (APPS_LIVE) $$("[data-apps-answer]").forEach(p => { p.textContent = t("faq.a5.live") })
  }

  /* ── La mascota ── */
  const DEFAULTS = { shape: "pebble", color: "mint", finish: "glow", eyes: "round", accent: "none" }
  const BLOB_HTML = '<span class="blob-figure"><span class="blob-body"><span class="blob-eye"><span class="blob-pupil"></span></span><span class="blob-eye"><span class="blob-pupil"></span></span><i class="blob-accent"></i></span></span>'
  function buildBlob(b, look) {
    if (!b.firstElementChild) b.innerHTML = BLOB_HTML
    // Cada uno parpadea a su ritmo: diez mascotas parpadeando a la vez se ven como una sola.
    if (!b.style.getPropertyValue("--blink")) b.style.setProperty("--blink", `${(-Math.random() * 5).toFixed(2)}s`)
    for (const k in DEFAULTS) b.dataset[k] = (look && look[k]) || b.dataset[k] || DEFAULTS[k]
  }
  $$("[data-blob]").forEach(b => buildBlob(b))

  const persona = { name: "Beevo", ...DEFAULTS }
  function applyPersona() {
    $$("[data-persona]").forEach(b => { for (const k in DEFAULTS) b.dataset[k] = persona[k] })
    $$("[data-persona-name]").forEach(n => { n.textContent = persona.name })
  }
  applyPersona()

  function hop(b) {
    if (!b || reduced) return
    b.classList.remove("is-hopping")
    void b.offsetWidth
    b.classList.add("is-hopping")
    clearTimeout(b._hop)
    b._hop = setTimeout(() => b.classList.remove("is-hopping"), 750)
  }
  function talk(b) {
    if (!b) return
    b.classList.remove("is-talking")
    void b.offsetWidth
    b.classList.add("is-talking")
    clearTimeout(b._talk)
    b._talk = setTimeout(() => b.classList.remove("is-talking"), 1800)
  }

  // Los ojos siguen al puntero. Con el ratón quieto, los de Beevo miran lo que pasa en la demo.
  const watched = new Set()
  const eyesIO = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? watched.add(e.target) : watched.delete(e.target))), { rootMargin: "120px" })
  $$("[data-blob]").forEach(b => eyesIO.observe(b))
  let pointer = null, lastMove = 0, attention = null
  addEventListener("pointermove", e => {
    if (e.pointerType === "touch") return
    pointer = [e.clientX, e.clientY]
    lastMove = performance.now()
  }, { passive: true })
  document.addEventListener("pointerleave", () => { pointer = null })
  function look() {
    const idle = !pointer || performance.now() - lastMove > 2600
    const focus = idle && attention ? attention() : null
    watched.forEach(b => {
      const target = (focus && b.hasAttribute("data-beevo")) ? focus : pointer
      if (!target) { b.style.removeProperty("--look-x"); b.style.removeProperty("--look-y"); return }
      const r = b.getBoundingClientRect()
      const dx = target[0] - (r.left + r.width / 2)
      const dy = target[1] - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const pull = Math.min(1, d / Math.max(60, r.width * 1.4))
      b.style.setProperty("--look-x", (dx / d * pull).toFixed(3))
      b.style.setProperty("--look-y", (dy / d * pull).toFixed(3))
    })
  }

  /* ── Scroll suave ── */
  let lenis = null
  if ("scrollRestoration" in history) history.scrollRestoration = "manual"
  scrollTo(0, 0)
  if (!reduced) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true })
    lenis.on("scroll", ScrollTrigger.update)
    gsap.ticker.add(time => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    window.__lenis = lenis
  }
  function scrollToTarget(target, offset = 0) {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.6, easing: k => 1 - Math.pow(1 - k, 4), userData: { auto: true } })
    else if (typeof target === "number") scrollTo({ top: target })
    else scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset })
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute("href")
    const target = id === "#top" ? 0 : $(id)
    if (target == null) return
    e.preventDefault()
    closeMenu()
    if ((id === "#demo" || id === "#producto") && tourJump) return tourJump(0)
    scrollToTarget(target, -(nav.offsetHeight + 8))
  })

  /* ── El notch ── */
  const NO_TR = "no-tr"
  // Cambia lo de dentro y anima el tamaño del cuerpo de lo de antes a lo de ahora, con muelle:
  // un tamaño que decide el contenido no se puede transicionar, así que se mide.
  function morph(body, change, opts = {}) {
    const notch = body.closest(".notch")
    const w0 = body.offsetWidth, h0 = body.offsetHeight
    gsap.killTweensOf(body)
    body.style.width = body.style.height = ""
    notch.classList.add(NO_TR)
    change()
    const w1 = body.offsetWidth, h1 = body.offsetHeight
    notch.classList.remove(NO_TR)
    if (reduced) return
    gsap.fromTo(body, { width: w0, height: h0 }, {
      width: w1, height: h1, duration: opts.d ?? .7, ease: opts.ease ?? "back.out(1.1)",
      onComplete: () => { body.style.width = body.style.height = "" }
    })
  }
  const wordsHTML = text => text.split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`).join(" ")

  class Notch {
    constructor(node, beevos) {
      this.el = node
      this.body = $("[data-notch-body]", node)
      this.line = $("[data-notch-line]", node)
      this.panel = $(".notch__panel", node)
      if (!this.panel) {
        this.panel = document.createElement("div")
        this.panel.className = "notch__panel"
        $(".notch__pill", node).after(this.panel)
      }
      this.blob = $(".notch__pill .blob", node)
      this.beevos = beevos || [this.blob]
      this.locked = false
    }
    has(c) { return this.el.classList.contains(c) }
    say(text, { hold = 0 } = {}) {
      if (this.locked) return
      clearTimeout(this._hush)
      if (this.has("is-open")) return
      if (this.has("is-speaking")) morph(this.body, () => { this.line.innerHTML = wordsHTML(text) }, { d: .55 })
      else { this.line.innerHTML = wordsHTML(text); this.el.classList.add("is-speaking") }
      this.beevos.forEach(talk)
      if (hold) this._hush = setTimeout(() => this.hush(), hold)
    }
    hush() { clearTimeout(this._hush); this.el.classList.remove("is-speaking") }
    open(html) {
      if (this.locked) return null
      morph(this.body, () => {
        this.hush()
        this.panel.innerHTML = html
        this.panel.style.display = "block"
        this.el.classList.add("is-open")
      })
      this.beevos.forEach(talk)
      return this.panel
    }
    swap(html) {
      if (this.locked || !this.has("is-open")) return null
      morph(this.body, () => { this.panel.innerHTML = html }, { d: .6 })
      this.beevos.forEach(talk)
      return this.panel
    }
    close() {
      if (this.locked || !this.has("is-open")) return
      morph(this.body, () => {
        this.panel.style.display = "none"
        this.panel.innerHTML = ""
        this.el.classList.remove("is-open")
      }, { d: .6, ease: "expo.out" })
    }
    think(on) {
      if (this.locked) return
      this.el.classList.toggle("is-thinking", on)
      this.beevos.forEach(b => { if (on) b.dataset.state = "thinking"; else delete b.dataset.state })
    }
    invite(on) { if (!this.locked) this.el.classList.toggle("is-inviting", on) }
    reset() {
      clearTimeout(this._hush)
      gsap.killTweensOf(this.body)
      this.body.style.width = this.body.style.height = ""
      this.panel.style.display = "none"
      this.panel.innerHTML = ""
      this.line.innerHTML = ""
      this.el.classList.remove("is-open", "is-speaking", "is-thinking", "is-inviting")
      this.beevos.forEach(b => delete b.dataset.state)
    }
  }

  const heroBlob = $("[data-hero-blob]")
  const pageNotch = new Notch($("[data-page-notch]"))
  const mockNotch = new Notch($("[data-mock-notch]"))
  mockNotch.beevos = [heroBlob, mockNotch.blob]

  /* ── La demo ──
     Cinco escenas con su reloj: el reloj se para si la demo no se ve, y cada escena espera a su
     momento (`at`) en vez de a un temporizador suelto. */
  const Demo = (() => {
    const tabs = $$("[data-tab]")
    const cap = $("[data-steps-cap]")
    const scene = $("[data-scene]")
    const main = $("[data-scene-root]")
    const cursor = $("[data-cursor]")
    const rails = $$("[data-rail]")
    // Lo que dura cada escena antes de volver a empezar: mientras se está en su tramo, se repite.
    const DUR = [10800, 9800, 10400, 8800, 11000]
    const CANCEL = Symbol("cancel")
    let current = 0, token = 0, clock = 0, waiters = [], started = false, paused = true
    const N = () => mockNotch

    const scaleK = () => main.getBoundingClientRect().width / main.offsetWidth || 1
    function local(node, ox = .5, oy = .5) {
      const mr = main.getBoundingClientRect(), r = node.getBoundingClientRect(), k = scaleK()
      return [(r.left - mr.left + r.width * ox) / k, (r.top - mr.top + r.height * oy) / k]
    }
    // El cursor es un <svg>, que no tiene `offsetWidth`: sin esto la cuenta daba NaN y se iba a la esquina.
    const cursorSize = () => cursor.getBoundingClientRect().width / scaleK() || 20
    function cursorTo(node, d = .9) {
      if (!node || !main.contains(node)) return gsap.to(cursor, { autoAlpha: 0, duration: .3 })
      const [x, y] = local(node, .55, .6)
      const w = cursorSize()
      return gsap.to(cursor, { x: x - w * .17, y: y - w * .17, autoAlpha: 1, duration: d, ease: "power3.inOut" })
    }
    function press(node) {
      gsap.timeline().to(cursor, { scale: .8, duration: .1, transformOrigin: "17% 17%" }).to(cursor, { scale: 1, duration: .3, ease: "back.out(3)" })
      if (node) gsap.fromTo(node, { scale: 1 }, { scale: .93, duration: .1, yoyo: true, repeat: 1 })
    }
    const type = (node, text, d) => { const o = { n: 0 }; return gsap.to(o, { n: text.length, duration: d, ease: "none", onUpdate: () => { node.textContent = text.slice(0, Math.round(o.n)) } }) }
    const think = text => `<div class="np"><p class="np__think"><span class="np__dots"><i></i><i></i><i></i></span>${esc(text)}</p></div>`
    const done = (text, extra = "") => `<div class="np"><div class="np__done"><span class="np__check">${ICON("check")}</span><p class="np__say">${esc(text)}</p></div>${extra}</div>`
    const FACE = { AG: "#caffd5", BS: "#d2d0fc", CM: "#edfc98", MO: "#ecbaf6" }
    const face = c => (c === "client" ? `<b class="face face--client">${t("client")}</b>` : `<b class="face" style="--c:${FACE[c]}">${c}</b>`)
    const railOn = name => rails.forEach(r => r.classList.toggle("is-on", r.dataset.rail === name))
    const hopBeevo = () => N().beevos.forEach(hop)
    function stage(html) {
      scene.innerHTML = html
      gsap.from(scene.children, { y: 14, autoAlpha: 0, duration: .7, stagger: .07, ease: "expo.out" })
    }
    const askPanel = () => `<div class="np"><div class="np__ask"><span data-typed></span><i class="caret"></i>${ICON("arrow-up")}</div></div>`

    // Clientes: el CRM primero. Se abre la ficha y se le pregunta a Beevo cómo va.
    async function sClient({ at }) {
      railOn("clients")
      const cl = t("s4.clients"), money = t("money")
      stage(`<div class="sc-head"><h4>${esc(t("s4.title"))}</h4><small>${esc(t("s4.count"))}</small></div>
        <div class="sc-crm">
          <div class="sc-ids">${cl.map((c, i) => `<div class="sc-idc" data-c="${i}"><b class="face" style="--c:${c[3]}">${c[4]}</b><strong>${esc(c[0])}</strong><span>${esc(c[1])}</span><em class="${i === 3 ? "is-new" : ""}">${esc(c[2])}</em></div>`).join("")}</div>
          <div class="sc-detail" data-detail><p class="sc-detail__empty">${esc(t("s4.pick"))}</p></div>
        </div>`)
      await at(500)
      const card = $('[data-c="0"]', scene)
      cursorTo(card, 1)
      await at(1500)
      press(card)
      card.classList.add("is-on")
      const detail = $("[data-detail]", scene)
      detail.innerHTML = `<div class="sc-dhead"><b class="face" style="--c:#ecbaf6">O</b><div><strong>Onne Studio</strong><em>${esc(cl[0][2])}</em></div></div>
        <p class="sc-dk">${esc(t("s4.contact"))}</p>
        <p class="sc-dline">Mateo Ruiz · mateo@onne.co</p><p class="sc-dline">+57 300 412 8890</p>
        <p class="sc-dk">${esc(t("s4.projects"))}</p>
        <div class="sc-proj"><i class="folder folder--rose folder--sm"></i><span>${esc(t("s4.p1"))}</span><span class="sc-bar"><i style="--p:0%" data-bar></i></span><small>6/9</small></div>
        <div class="sc-proj"><i class="folder folder--lilac folder--sm"></i><span>${esc(t("s4.p2"))}</span><span class="sc-bar"><i style="--p:40%"></i></span><small>2/5</small></div>
        <p class="sc-dk">${esc(t("s4.owed"))}</p>
        <div class="sc-owed" data-owed><small>${esc(t("s4.invoice"))}</small><b>${money(2400000)}</b></div>`
      gsap.from(detail.children, { autoAlpha: 0, y: 8, stagger: .05, duration: .45, ease: "power2.out" })
      gsap.to($("[data-bar]", detail), { "--p": "66%", duration: 1, delay: .5, ease: "power2.out" })
      await at(2700)
      const pill = $(".notch__pill", N().el)
      cursorTo(pill, .9)
      await at(3600)
      press(pill)
      const panel = N().open(askPanel())
      gsap.to(cursor, { x: "+=90", y: "+=140", autoAlpha: 0, duration: .8, delay: .3 })
      const typed = panel && $("[data-typed]", panel)
      if (typed) type(typed, t("s4.ask"), .9)
      await at(5000)
      N().swap(think(t("s4.doing")))
      N().think(true)
      await at(6200)
      N().think(false)
      N().swap(done(t("s4.done"), `<div class="chips" style="margin-top:.7em"><span class="chip chip--mint">${esc(t("s4.c1"))}</span><span class="chip">${esc(t("s4.c2"))}</span></div>`))
      hopBeevo()
      const owed = $("[data-owed]", scene)
      if (owed) gsap.fromTo(owed, { backgroundColor: "#f5e4f9" }, { backgroundColor: "#ffffff", duration: 1.8, delay: .4 })
      await at(9800)
      N().close()
    }

    // Beevo AI: se le suelta un PDF al notch, lo lee y propone las tareas, que vuelan al tablero.
    async function sPlan({ at }) {
      railOn("projects")
      const rows = t("s0.rows")
      stage(`<p class="sc-crumb">${t("s.projects")} › Café Origen</p>
        <div class="sc-head"><i class="folder folder--mint"></i><h4>${t("s0.title")}</h4><span class="sc-faces">${face("AG")}${face("BS")}${face("CM")}</span></div>
        <div class="sc-board">
          <div class="sc-col"><p><span>${t("col.todo")}</span><em data-count>0</em></p><div class="sc-cards" data-cards></div><span class="sc-add">+ ${t("s.newtask")}</span></div>
          <div class="sc-col"><p><span>${t("col.doing")}</span><em>0</em></p><span class="sc-add">+ ${t("s.newtask")}</span></div>
          <div class="sc-col"><p><span>${t("col.done")}</span><em>0</em></p><span class="sc-add">+ ${t("s.newtask")}</span></div>
        </div>`)
      const file = el(`<div class="drag-file"><b class="pdf-badge">PDF</b><div>${esc(t("s0.file"))}<small>2 ${t("s.pages")}</small></div></div>`)
      main.appendChild(file)
      const W = main.offsetWidth, H = main.offsetHeight
      gsap.set(file, { x: W - file.offsetWidth - W * .07, y: H - file.offsetHeight - H * .09, autoAlpha: 0, scale: .9 })
      await at(600)
      gsap.to(file, { autoAlpha: 1, scale: 1, duration: .5, ease: "back.out(2)" })
      cursorTo(file, 1.1)
      await at(1700)
      press()
      gsap.to(file, { rotate: -4, scale: 1.04, duration: .25 })
      const [nx, ny] = local(N().el, .5, 1)
      const fx = nx - file.offsetWidth / 2, fy = main.contains(N().el) ? ny - 6 : 20
      gsap.to(file, { x: fx, y: fy, duration: 1.2, ease: "power3.inOut" })
      gsap.to(cursor, { x: fx + file.offsetWidth * .55, y: fy + file.offsetHeight * .5, duration: 1.2, ease: "power3.inOut" })
      await at(2300)
      N().invite(true)
      N().say(t("s0.drop"))
      await at(3300)
      gsap.to(file, { y: "-=24", scale: .2, autoAlpha: 0, duration: .45, ease: "power2.in" })
      gsap.to(cursor, { x: "+=140", y: "+=110", autoAlpha: 0, duration: .9, delay: .2 })
      N().invite(false)
      N().think(true)
      N().say(t("s0.reading"))
      await at(4700)
      N().think(false)
      const panel = N().open(`<div class="np"><p class="np__say">${esc(t("s0.propose"))}</p>
        <div class="np__rows">${rows.map(r => `<div class="np__row"><i class="chk">${ICON("check")}</i><span>${esc(r[0])}</span><em>${esc(r[1])}</em>${face(r[2])}</div>`).join("")}</div>
        <div class="np__foot"><small>${esc(t("s0.questions"))}</small><span class="btn btn--ink" data-go>${esc(t("s0.create"))}</span></div></div>`)
      if (panel) gsap.from($$(".np__row", panel), { autoAlpha: 0, y: 8, stagger: .13, duration: .45, delay: .3, ease: "power2.out" })
      await at(7000)
      const go = panel && $("[data-go]", panel)
      cursorTo(go, .9)
      await at(8000)
      press(go)
      await at(8250)
      const box = $("[data-cards]", scene)
      const cards = rows.map(r => el(`<div class="sc-card" style="opacity:0"><span>${esc(r[0])}</span><small>${esc(r[1])}${face(r[2])}</small></div>`))
      cards.forEach(c => box.appendChild(c))
      const rowEls = panel ? $$(".np__row", panel) : []
      const fly = rowEls.length && main.contains(rowEls[0]) && !reduced
      cards.forEach((card, i) => {
        if (fly) {
          const [x0, y0] = local(rowEls[i], 0, 0), [x1, y1] = local(card, 0, 0)
          const clone = rowEls[i].cloneNode(true)
          clone.classList.add("fly")
          clone.style.width = `${rowEls[i].getBoundingClientRect().width / scaleK()}px`
          main.appendChild(clone)
          gsap.fromTo(clone, { x: x0, y: y0 }, {
            x: x1, y: y1, width: card.offsetWidth, duration: .8, delay: i * .08, ease: "power3.inOut",
            onComplete: () => { clone.remove(); gsap.to(card, { opacity: 1, duration: .25 }) }
          })
        } else gsap.to(card, { opacity: 1, duration: .4, delay: i * .08 })
      })
      N().close()
      gsap.to(cursor, { autoAlpha: 0, duration: .4 })
      const count = $("[data-count]", scene), o = { n: 0 }
      gsap.to(o, { n: rows.length, duration: 1, delay: .4, onUpdate: () => { count.textContent = Math.round(o.n) } })
      await at(9500)
      N().say(t("s0.done"))
      hopBeevo()
    }

    // La ventana pasa a ser la del cliente: sin barra lateral, sin Beevo y con su propia dirección.
    const winApp = $(".win__app"), winUrl = $(".win__url")
    function publicView(on, path) {
      winApp.classList.toggle("is-public", on)
      winUrl.textContent = on ? path : "app.beevo.co"
      mockNotch.el.classList.toggle("is-away", on)
    }
    // Dónde queda un rectángulo de pantalla dentro de la ventana, sin la escala del scroll.
    function localRect(r, ox, oy) {
      const mr = main.getBoundingClientRect(), k = scaleK()
      return [(r.left - mr.left + r.width * ox) / k, (r.top - mr.top + r.height * oy) / k]
    }

    // Equipo: el tablero de todos, filtrado por una cara; una tarea pasa a revisión y el equipo se entera.
    async function sTeam({ at }) {
      railOn("tasks")
      const cols = t("s5.cols"), cards = t("s5.cards")
      stage(`<div class="sc-head"><h4>${esc(t("s5.title"))}</h4><span class="sc-people">${["AG", "BS", "CM"].map(p => `<b class="face sc-pp" data-pp="${p}" style="--c:${FACE[p]}">${p}</b>`).join("")}<b class="face sc-pp sc-pp--more">+2</b></span></div>
        <div class="sc-board sc-board--4">${cols.map((c, ci) => {
          const mine = cards.filter(k => k[0] === ci)
          return `<div class="sc-col" data-col="${ci}"><p><span>${esc(c)}</span><em data-count>${mine.length}</em></p>${mine.map(k => `<div class="sc-card" data-who="${k[3]}" style="--edge:${k[4]}"><span>${esc(k[1])}</span><small>${esc(k[2])}${face(k[3])}</small></div>`).join("")}</div>`
        }).join("")}</div>`)
      await at(600)
      const bruno = $('[data-pp="BS"]', scene)
      cursorTo(bruno, 1)
      await at(1500)
      press(bruno)
      bruno.classList.add("is-on")
      $$(".sc-card", scene).forEach(c => c.classList.toggle("is-dim", c.dataset.who !== "BS"))
      await at(2600)
      const card = $$(".sc-card", scene).find(c => c.textContent.includes(cards[3][1]))
      cursorTo(card, .9)
      await at(3500)
      press()
      const from = card.closest(".sc-col"), to = $('[data-col="2"]', scene)
      const first = card.getBoundingClientRect()
      $("p", to).after(card)
      const last = card.getBoundingClientRect(), k = scaleK()
      gsap.fromTo(card, { x: (first.left - last.left) / k, y: (first.top - last.top) / k, rotate: 2.5, scale: 1.05, zIndex: 6 },
        { x: 0, y: 0, rotate: 0, scale: 1, duration: 1.1, ease: "power3.inOut", clearProps: "zIndex" })
      const [cx, cy] = localRect(last, .55, .6), w = cursorSize()
      gsap.to(cursor, { x: cx - w * .17, y: cy - w * .17, duration: 1.1, ease: "power3.inOut" })
      $("[data-count]", from).textContent = $$(".sc-card", from).length
      $("[data-count]", to).textContent = $$(".sc-card", to).length
      await at(4800)
      gsap.to(cursor, { autoAlpha: 0, duration: .5 })
      const notice = el(`<div class="sc-notice">${face("BS")}<span>${esc(t("s5.notice"))}</span></div>`)
      main.appendChild(notice)
      gsap.from(notice, { y: -18, scale: .9, autoAlpha: 0, duration: .6, ease: "back.out(2)" })
      await at(7200)
      gsap.to(notice, { y: -10, autoAlpha: 0, duration: .4 })
      cursorTo(bruno, .9)
      await at(8100)
      press(bruno)
      bruno.classList.remove("is-on")
      $$(".sc-card", scene).forEach(c => c.classList.remove("is-dim"))
      gsap.to(cursor, { autoAlpha: 0, duration: .5, delay: .4 })
    }

    // Proyecto compartido: se crea el enlace, se elige qué ve el cliente, y se ve como lo ve él.
    async function sShare({ at }) {
      railOn("projects")
      const cards = t("s6.cards"), cols = t("s5.cols"), files = t("s6.files"), money = t("money")
      const board = () => `<div class="sc-board">${[0, 1, 2].map(ci => {
        const mine = cards.filter(c => c[0] === ci)
        return `<div class="sc-col"><p><span>${esc(cols[ci])}</span><em>${mine.length}</em></p>${mine.map(c => `<div class="sc-card" style="--edge:#bd7dca"><span>${esc(c[1])}</span></div>`).join("")}</div>`
      }).join("")}</div>`
      const tiles = files.slice(0, 3).map((f, i) => `<span class="sc-ftile">${i === 2 ? '<b class="pdf-badge">PDF</b>' : '<i class="folder folder--rose"></i>'}<small>${esc(f)}</small></span>`).join("")
      stage(`<p class="sc-crumb">${esc(t("s6.crumb"))}</p>
        <div class="sc-head"><i class="folder folder--rose"></i><h4>${esc(t("s6.title"))}</h4><span class="sc-tools"><b class="sc-tool" data-share>${ICON("share")}</b><b class="sc-tool">${ICON("pencil")}</b></span></div>
        <div class="sc-desk2">${board()}<div class="sc-files"><p class="sc-label">${esc(t("s6.material"))}</p><div class="sc-ftiles">${tiles}<span class="sc-ftile"><i class="folder folder--lemon"></i><small>${esc(files[3])}</small></span></div></div></div>`)
      await at(500)
      const share = $("[data-share]", scene)
      cursorTo(share, 1)
      await at(1400)
      press(share)
      const sheet = el(`<div class="sc-sheet"><h5>${esc(t("s6.sheet"))}</h5>
        <ul class="sc-sees">${t("s6.sees").map(([txt, on]) => `<li class="${on ? "is-on" : ""}"><i>${ICON("check")}</i>${esc(txt)}</li>`).join("")}</ul>
        <div class="sc-linkrow" data-linkrow><span class="btn btn--ink" data-enable>${esc(t("s6.enable"))}</span></div></div>`)
      main.appendChild(sheet)
      gsap.from(sheet, { x: 40, autoAlpha: 0, duration: .6, ease: "expo.out" })
      gsap.from($$("li", sheet), { autoAlpha: 0, x: 10, stagger: .07, duration: .4, delay: .2 })
      await at(2500)
      const enable = $("[data-enable]", sheet)
      cursorTo(enable, .8)
      await at(3300)
      press(enable)
      share.classList.add("is-on")
      const row = $("[data-linkrow]", sheet)
      row.innerHTML = `<p class="sc-dk">${esc(t("s6.link"))}</p><div class="sc-link"><span>app.beevo.co/p/k3F9xQ</span><b class="chip chip--mint" data-copy>${esc(t("s6.copy"))}</b></div>`
      gsap.from(row.children, { autoAlpha: 0, y: 6, stagger: .08, duration: .4 })
      await at(4300)
      const copy = $("[data-copy]", sheet)
      cursorTo(copy, .7)
      await at(5000)
      press(copy)
      copy.innerHTML = `${ICON("check")}${esc(t("s6.copied"))}`
      await at(6000)
      gsap.to([sheet, cursor], { autoAlpha: 0, duration: .3 })
      publicView(true, "app.beevo.co/p/k3F9xQ")
      stage(`<span class="sc-badge">${esc(t("s6.client"))}</span>
        <div class="sc-pub"><p>${esc(t("s6.by"))}</p><h4><i class="folder folder--rose"></i>${esc(t("s6.title"))}</h4></div>
        <div class="sc-desk2">${board()}<div class="sc-files"><p class="sc-label">${esc(t("s6.material"))}</p><div class="sc-ftiles">${tiles}</div>
          <p class="sc-label" style="margin-top:1em">${esc(t("s6.invoices"))}</p><div class="sc-owed"><small>${esc(t("s6.inv"))}</small><b>${money(2400000)}</b></div></div></div>`)
    }

    // Cobros: Beevo deja lista la cuenta de cobro del mes y tú decides. Se envía y el cliente la descarga.
    async function sBilling({ at }) {
      railOn("invoices")
      const money = t("money"), steps = t("s7.steps")
      const paper = (num, state, sent) => `<div class="sc-paper sc-paper--big">
          <header><b data-pnum>${esc(num)}</b><em class="${sent ? "is-issued" : ""}" data-pstate>${esc(state)}</em></header>
          <div class="to">${esc(t("s7.to"))}<strong>Yourlay S.A.S.</strong></div>
          <div><div class="ln"><span>${esc(t("s7.line"))}</span><span>${money(1200000)}</span></div></div>
          <div class="tot"><span>Total</span><span>${money(1200000)}</span></div>
        </div>`
      stage(`<div class="sc-invpage">
          <div class="sc-desk">${paper(t("s7.paper"), t("s7.draft"), false)}</div>
          <aside class="sc-rail">
            <ol class="sc-track">${steps.map((st, i) => `<li class="${i === 0 ? "is-done" : ""}"><i></i>${esc(st)}</li>`).join("")}</ol>
            <span class="sc-repeat is-on">${ICON("repeat")}<span>${esc(t("s7.auto"))}</span></span>
            <div class="sc-railbody" data-rb><p class="sc-railt">${esc(t("s7.ask"))}</p>
              <span class="btn btn--mint sc-railbtn" data-send>${ICON("mail")}<span>${esc(t("s7.send"))}</span></span>
              <span class="btn btn--soft sc-railbtn">${esc(t("s7.discard"))}</span></div>
          </aside>
        </div>`)
      const track = $$(".sc-track li", scene)
      await at(400)
      N().say(t("s7.beevo"))
      hopBeevo()
      await at(1900)
      const send = $("[data-send]", scene)
      cursorTo(send, .9)
      await at(2900)
      press(send)
      track[1].classList.add("is-done")
      $("[data-pnum]", scene).textContent = `${t("s7.paper")} 0013`
      const state = $("[data-pstate]", scene)
      state.textContent = t("s7.sent")
      state.classList.add("is-issued")
      gsap.fromTo(state, { scale: .6 }, { scale: 1, duration: .5, ease: "back.out(3)" })
      const rb = $("[data-rb]", scene)
      rb.innerHTML = `<div class="sc-sent"><span class="np__check">${ICON("check")}</span><span>${esc(t("s7.sentto"))}</span></div>`
      gsap.from(rb.children, { autoAlpha: 0, y: 6, duration: .4 })
      await at(3200)
      track[2].classList.add("is-done")
      await at(4800)
      gsap.to(cursor, { autoAlpha: 0, duration: .3 })
      publicView(true, "app.beevo.co/f/Yq82Lm")
      stage(`<span class="sc-badge">${esc(t("s7.client"))}</span>
        <div class="sc-pubinv"><div class="sc-pubbar"><span class="btn btn--ink sc-railbtn" data-dl>${ICON("download")}<span>${esc(t("s7.pdf"))}</span></span></div>
          ${paper(`${t("s7.paper")} 0013`, t("s7.sent"), true)}<p class="sc-pfoot">${esc(t("s7.footer"))}</p></div>`)
      await at(6000)
      const dl = $("[data-dl]", scene)
      cursorTo(dl, .9)
      await at(6900)
      press(dl)
    }

    const SCENES = [sClient, sTeam, sShare, sBilling, sPlan]

    // La barra de cada paso se llena mientras dura su tramo.
    const ring = (i, p) => tabs[i]?.style.setProperty("--p", p.toFixed(3))
    // En un teléfono la lista es una fila de pestañas, y lo que dice la elegida se lee debajo.
    function caption() {
      const tb = tabs[current]
      if (!cap || !tb) return
      cap.innerHTML = `<b>${esc($(".step__t", tb).textContent)}</b><span>${esc($(".step__b", tb).textContent.trim())}</span>`
    }
    function at(ms) {
      const my = token
      return new Promise((resolve, reject) => {
        if (my !== token) return reject(CANCEL)
        waiters.push({ t: ms, my, resolve, reject })
      })
    }
    function reset() {
      gsap.killTweensOf(scene.querySelectorAll("*"))
      $$(".drag-file, .fly, .sc-sheet, .sc-notice", main).forEach(n => { gsap.killTweensOf(n); n.remove() })
      publicView(false)
      scene.innerHTML = ""
      N().reset()
      gsap.killTweensOf(cursor)
      gsap.set(cursor, { autoAlpha: 0, scale: 1, x: main.offsetWidth * .72, y: main.offsetHeight * .82 })
    }
    function go(i) {
      token++
      waiters.forEach(w => w.reject(CANCEL))
      waiters = []
      current = (i + SCENES.length) % SCENES.length
      clock = 0
      tabs.forEach((tb, k) => {
        tb.setAttribute("aria-selected", String(k === current))
        tb.classList.toggle("is-on", k === current)
      })
      caption()
      reset()
      SCENES[current]({ at }).catch(e => { if (e !== CANCEL) console.error(e) })
    }
    gsap.ticker.add((time, dt) => {
      if (!started || paused) return
      clock += Math.min(dt, 64)
      waiters = waiters.filter(w => {
        if (w.my !== token) { w.reject(CANCEL); return false }
        if (clock >= w.t) { w.resolve(); return false }
        return true
      })
      if (clock >= DUR[current]) go(current)
    })
    // Pulsar un paso lleva a su tramo del recorrido.
    tabs.forEach((tb, k) => tb.addEventListener("click", () => { if (tourJump) tourJump(k); else { started = true; go(k) } }))

    // Con el ratón quieto, Beevo mira el cursor de la demo.
    attention = () => {
      if (paused || gsap.getProperty(cursor, "opacity") < .5) return null
      const r = cursor.getBoundingClientRect()
      return [r.left + r.width * .3, r.top + r.height * .3]
    }

    return {
      start() { if (started) return; started = true; go(0) },
      setPaused(p) { paused = p },
      // El recorrido elige la escena; los pasos dicen cuánto se ha visto.
      select(i) {
        if (i === current && started) return
        started = true
        go(i)
        const tb = tabs[i], bar = tb?.closest(".steps__list")
        if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: tb.offsetLeft - (bar.clientWidth - tb.offsetWidth) / 2, behavior: "smooth" })
      },
      progress(i, frac) { tabs.forEach((tb, k) => ring(k, k < i ? 1 : k === i ? frac : 0)) }
    }
  })()

  /* ── El recorrido ──
     La tarjeta se queda fija y cada tramo de scroll es una escena. Así no hay demo que pasar de
     largo: para seguir bajando hay que verlas. */
  let tourJump = null
  const tourEl = $("[data-tour]")
  const pinTop = () => Math.round(nav.offsetHeight + (narrow() ? 8 : 14))
  function setupTour() {
    const N = $$("[data-tab]").length
    let step = 0
    const st = ScrollTrigger.create({
      trigger: tourEl, pin: true, invalidateOnRefresh: true,
      start: () => `top ${pinTop()}px`,
      end: () => `+=${Math.round(innerHeight * .62 * N)}`,
      onUpdate: s => {
        const f = s.progress * N, i = clamp(Math.floor(f), 0, N - 1)
        if (i !== step) { step = i; Demo.select(i) }
        Demo.progress(i, s.progress >= 1 ? 1 : f - i)
      }
    })
    tourJump = k => scrollToTarget(Math.ceil(st.start + (k + .1) * (st.end - st.start) / N) + 1)
  }

  /* ── El vuelo: de asomarse sobre la demo a vivir en su notch ──
     Empieza cuando la tarjeta del producto entra por abajo y termina cuando se queda fija. */
  const mascot = $("[data-hero-mascot]")
  const frame = $("[data-demo-frame]")
  const seat = $("[data-mock-seat]")
  let landed = false, greeted = false
  function updateFlight() {
    const tr = tourEl.getBoundingClientRect()
    const from = innerHeight * .92, to = pinTop()
    const flight = clamp((from - tr.top) / (from - to), 0, 1)
    if (!greeted && tr.top < innerHeight) { greeted = true; setTimeout(() => hop(heroBlob), 350) }
    const S = heroBlob.offsetWidth
    const m = mascot.getBoundingClientRect()
    const hx = m.left + m.width / 2, hy = m.top + S / 2
    const sr = seat.getBoundingClientRect()
    const tx = sr.left + sr.width / 2, ty = sr.top + sr.height / 2, ts = sr.width / S
    const p1 = easeOut(clamp(flight / .3, 0, 1)), p2 = easeInOut(clamp((flight - .3) / .7, 0, 1))
    const fy = hy - S * .4 * p1, fs = 1 + .05 * p1
    const x = lerp(hx, tx, p2)
    const y = lerp(fy, ty, p2) - Math.sin(Math.PI * p2) * S * .35
    const s = lerp(fs, ts, p2)
    heroBlob.style.transform = `translate(${(x - hx).toFixed(2)}px, ${(y - hy).toFixed(2)}px) scale(${s.toFixed(4)})`
    // Mientras no ha salido, lo que queda por debajo del canto de la demo no se ve: se asoma.
    let clip = 0
    if (p2 === 0) {
      const fr = frame.getBoundingClientRect()
      clip = clamp((y + S * s / 2 - fr.top) / (S * s), 0, 1) * 100
    }
    heroBlob.style.clipPath = `inset(0 0 ${clip.toFixed(2)}% 0)`
    const now = flight >= .995
    heroBlob.style.opacity = now ? 0 : 1
    if (now !== landed) {
      landed = now
      mockNotch.el.classList.toggle("has-beevo", landed)
      if (landed) hop(mockNotch.blob)
    }
  }

  /* ── El notch es el menú ──
     Arriba, siempre, como en el producto: Beevo y el icono que dice que se abre. Pulsarlo lo despliega
     con las secciones y los dos botones. No dice nada más: lo que Beevo cuenta se ve en la demo, que
     tiene su propio notch. Tuvo en la portada a Beevo hablando y luego narrando cada sección, y eran
     dos voces en la misma página. */
  const toggle = $("[data-notch-toggle]")
  function openMenu() {
    morph(pageNotch.body, () => pageNotch.el.classList.add("is-menu"))
    hop(pageNotch.blob)
    toggle.setAttribute("aria-expanded", "true")
  }
  function closeMenu() {
    if (!pageNotch.has("is-menu")) return
    toggle.setAttribute("aria-expanded", "false")
    morph(pageNotch.body, () => pageNotch.el.classList.remove("is-menu"), { d: .55, ease: "expo.out" })
  }
  toggle.addEventListener("click", () => (pageNotch.has("is-menu") ? closeMenu() : openMenu()))
  document.addEventListener("pointerdown", e => { if (!pageNotch.el.contains(e.target)) closeMenu() })
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu() })
  // Baja como la píldora que es cuando la cortina ya se ha ido, y desde ahí no se va.
  function dropNotch() {
    pageNotch.el.classList.add("is-here")
    if (!reduced) gsap.fromTo(pageNotch.el, { yPercent: -120 }, { yPercent: 0, duration: .7, ease: "back.out(1.6)", onComplete: () => hop(pageNotch.blob) })
  }

  /* ── Beevo AI: Beevo en el centro y, en arcos a su alrededor, lo que conoce de tu estudio ──
     Salen de él al llegar, se mecen con el scroll y se apartan un poco hacia el puntero; al pasar
     por encima (o al tocarlas) dicen qué son. */
  function setupOrbit() {
    const orbit = $("[data-orbit]")
    if (!orbit) return
    const field = $("[data-orbit-field]", orbit)
    const toks = $$("[data-tok]", orbit)
    const label = $("[data-orbit-label]", orbit)
    const core = $(".orbit__core .blob", orbit)
    const RINGS = [
      { n: 5, r: .36, a0: 200, a1: 340, s: 1 },
      { n: 7, r: .56, a0: 196, a1: 344, s: .9 },
      { n: 8, r: .76, a0: 216, a1: 324, s: .8 }
    ]
    const spots = []
    RINGS.forEach((ring, ri) => {
      for (let i = 0; i < ring.n; i++) {
        const j = spots.length
        spots.push({ ri, a: ring.a0 + (ring.a1 - ring.a0) * (i / (ring.n - 1)) + (((j * 37) % 5) - 2) * .8, r: ring.r + (((j * 53) % 5) - 2) * .004, s: ring.s, k: reduced ? 1 : 0 })
      }
    })
    toks.forEach((tk, i) => tk.style.setProperty("--d", `${((i * .37) % 3).toFixed(2)}s`))
    let rot = 0, on = false, shown = null, hide = 0
    const par = [0, 0], parTo = [0, 0]
    new IntersectionObserver(([e]) => { on = e.isIntersecting }).observe(orbit)
    ScrollTrigger.create({ trigger: orbit, start: "top bottom", end: "bottom top", onUpdate: s => { rot = (s.progress - .5) * 10 } })
    ScrollTrigger.create({
      trigger: orbit, start: "top 72%", once: true,
      onEnter: () => {
        hop(core)
        gsap.to(spots, { k: 1, duration: 1.15, ease: "back.out(1.7)", stagger: .04 })
      }
    })
    orbit.addEventListener("pointermove", e => {
      const r = orbit.getBoundingClientRect()
      parTo[0] = ((e.clientX - r.left) / r.width - .5) * 2
      parTo[1] = ((e.clientY - r.top) / r.height - .5) * 2
    })
    orbit.addEventListener("pointerleave", () => { parTo[0] = parTo[1] = 0 })
    const showLabel = tk => { clearTimeout(hide); shown = tk; label.textContent = tk.dataset.label || ""; label.classList.add("is-on") }
    const hideLabel = () => { shown = null; label.classList.remove("is-on") }
    toks.forEach(tk => {
      tk.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") showLabel(tk) })
      tk.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hideLabel() })
      // Con el dedo no hay «pasar por encima»: tocarla la nombra un momento.
      tk.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") { showLabel(tk); hide = setTimeout(hideLabel, 1600) } })
    })
    gsap.ticker.add(() => {
      if (!on) return
      par[0] = lerp(par[0], parTo[0], .08)
      par[1] = lerp(par[1], parTo[1], .08)
      const W = field.clientWidth, H = field.clientHeight
      const cx = W / 2, cy = H * .84, R = Math.min(H * .92, W * .74)
      toks.forEach((tk, i) => {
        const sp = spots[i]
        const a = (sp.a + rot * (sp.ri % 2 ? -1 : 1) * (sp.ri + 1)) * Math.PI / 180
        let x = cx + Math.cos(a) * R * sp.r, y = cy + Math.sin(a) * R * sp.r
        x = lerp(cx, x, sp.k) + par[0] * (sp.ri + 1) * 6
        y = lerp(cy, y, sp.k) + par[1] * (sp.ri + 1) * 6
        const half = tk.offsetWidth * sp.s / 2 + 4
        x = clamp(x, half, W - half)
        tk._x = x; tk._y = y
        gsap.set(tk, { x, y, xPercent: -50, yPercent: -50, scale: sp.s * clamp(sp.k * 1.1, 0, 1.2), autoAlpha: sp.k > .02 ? 1 : 0 })
      })
      if (shown) gsap.set(label, { x: shown._x, y: shown._y - shown.offsetHeight * .5 - 34 })
    })
  }

  /* ── Hazlo tuyo: pulsar uno del dock viste a Beevo, al del centro y al del notch ── */
  function setupLineup() {
    const ones = $$("[data-preset]")
    const core = $(".orbit__core .blob")
    ones.forEach(btn => {
      const b = $(".blob", btn)
      btn.addEventListener("pointerenter", () => hop(b))
      btn.addEventListener("click", () => {
        Object.assign(persona, JSON.parse(btn.dataset.preset))
        applyPersona()
        ones.forEach(o => {
          o.classList.toggle("is-on", o === btn)
          o.setAttribute("aria-pressed", String(o === btn))
        })
        hop(b)
        hop(core)
        hop(pageNotch.blob)
      })
    })
  }

  /* ── Cada sección, entera ──
     El scroll suave lo pone Lenis. Encima, al dejar de bajar: si una sección que cabe en la pantalla
     quedó casi entera a la vista pero cortada, la página se desliza lo que falta para verla completa,
     centrada debajo de la barra. No frena a nadie: solo actúa con el scroll ya quieto, cualquier gesto
     lo interrumpe, sigue la dirección en la que se iba y hacia atrás solo corrige pasarse un poco.
     Dentro del recorrido de la demo no hace nada: ahí la tarjeta ya está quieta y entera. */
  function setupSettle() {
    if (!lenis) return
    const targets = $$("[data-snap]")
    let timer = 0, dir = 1
    lenis.on("scroll", l => {
      if (l.direction) dir = l.direction
      clearTimeout(timer)
      if (l.userData?.auto) return
      timer = setTimeout(settle, 140)
    })
    function settle() {
      if (lenis.isScrolling || lenis.isStopped) return
      const y = lenis.scroll, vh = innerHeight, top = nav.offsetHeight, room = vh - top
      if (ScrollTrigger.getAll().some(st => st.pin && y > st.start + 2 && y < st.end - 2)) return
      let best = null
      for (const el of targets) {
        const r = el.getBoundingClientRect()
        if (r.height > room - 8) continue
        const seen = (Math.min(r.bottom, vh) - Math.max(r.top, top)) / r.height
        // Una sección grande ya entera a la vista es la que se está mirando: no se mueve nada.
        if (seen >= .995) { if (r.height > room * .4) return; continue }
        if (seen < .5) continue
        const want = el.dataset.snap === "pin" ? pinTop() : top + (room - r.height) / 2
        const d = r.top - want
        const ahead = Math.sign(d) === dir
        if (ahead ? Math.abs(d) > vh * .5 : (seen < .75 || Math.abs(d) > vh * .22)) continue
        if (!best || seen > best.seen) best = { d, seen }
      }
      if (!best || Math.abs(best.d) < 4) return
      lenis.scrollTo(y + best.d, {
        duration: clamp(.45 + Math.abs(best.d) / 1100, .55, 1.1),
        easing: k => 1 - Math.pow(1 - k, 3),
        userData: { auto: true }
      })
    }
  }

  /* ── Precios ──
     Copiados de `Billing::Plan` (app/models/billing/plan.rb) en la unidad mínima de cada moneda,
     igual que en ../site. El anual es doce meses menos el 20 %, redondeado. */
  const PRICES = {
    solo: { monthly: { usd: 999, eur: 999, cop: 2_990_000 } },
    team: { monthly: { usd: 799, eur: 799, cop: 2_490_000 } },
    lifetime: { once: { usd: 45_900, eur: 45_900, cop: 99_000_000 } }
  }
  const ANNUAL_DISCOUNT = 20
  const APP = "https://app.beevo.co"
  /* La moneda no se elige: la decide el país, con la regla del Rails (`Billing::Plan.currency_for`):
     Colombia en pesos, Europa en euros y el resto en dólares. Quien sabe el país es la app, que lo
     lee de la conexión (`CURRENCY_URL`); esta lista es la de `Billing::Plan::EUROPE` y solo se usa
     si la app no contesta. */
  const CURRENCY_URL = `${APP}/precios/moneda`
  const EUROPE = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
    "IS", "LI", "NO", "CH", "GB", "AD", "MC", "SM", "VA", "GI", "IM", "JE", "GG", "FO", "AX", "AL", "BA", "ME", "MK", "RS", "XK", "MD", "UA"
  ]
  /* Se pregunta una vez y, si en dos segundos no hay respuesta —o falla—, se adivina con lo que
     sabe el navegador: la zona horaria de Bogotá o un idioma con país (un «es» a secas no dice
     nada). Sin cookies: la landing no tiene nada que contarle a la app de quien mira. */
  function visitorCurrency() {
    const guess = () => {
      try { if (Intl.DateTimeFormat().resolvedOptions().timeZone === "America/Bogota") return "cop" } catch { /* sin Intl */ }
      const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ""]
      const region = langs.map(l => /^[a-z]{2,3}-([a-z]{2})\b/i.exec(l)?.[1]?.toUpperCase()).find(Boolean)
      if (region === "CO") return "cop"
      return EUROPE.includes(region) ? "eur" : "usd"
    }
    const asked = fetch(CURRENCY_URL, { credentials: "omit" })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ currency } = {}) => {
        const c = String(currency || "").toLowerCase()
        return ["usd", "eur", "cop"].includes(c) ? c : Promise.reject(c)
      })
    const late = new Promise(resolve => setTimeout(() => resolve(guess()), 2000))
    return Promise.race([asked, late]).catch(guess)
  }
  const pricing = { interval: "month", currency: null }
  const amount = (plan, interval, cur) => {
    const def = PRICES[plan]
    if (def.once) return def.once[cur]
    const m = def.monthly[cur]
    return interval === "year" ? Math.round((m * 12 * (100 - ANNUAL_DISCOUNT)) / 100) : m
  }
  const perMonth = (plan, interval, cur) => (interval === "year" ? Math.round(amount(plan, interval, cur) / 12) : amount(plan, interval, cur))
  // Pesos sin centavos; dólares y euros con los suyos, salvo que sean redondos.
  function price(cents, cur) {
    const v = cents / 100
    const loc = lang === "es" ? "es-CO" : "en-US"
    if (cur === "cop") {
      const n = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(v)
      return lang === "es" ? `$ ${n}` : `COP ${n}`
    }
    const dec = cents % 100 === 0 ? 0 : 2
    const n = new Intl.NumberFormat(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v)
    if (lang === "es") return cur === "eur" ? `${n} €` : `US$ ${n}`
    return cur === "eur" ? `€${n}` : `$${n}`
  }
  function paintSeg(seg) {
    const on = $(".is-on", seg)
    if (!on) return
    seg.style.setProperty("--x", `${on.offsetLeft}px`)
    seg.style.setProperty("--w", `${on.offsetWidth}px`)
  }
  function paintPrices(animate = true) {
    const box = $("[data-plans]")
    if (!box) return
    $$("[data-interval]", box).forEach(b => b.classList.toggle("is-on", b.dataset.interval === pricing.interval))
    $$(".seg", box).forEach(paintSeg)
    $$(".plan", box).forEach(card => {
      const plan = card.dataset.plan
      const interval = PRICES[plan].once ? "once" : pricing.interval
      const cur = pricing.currency
      const node = $("[data-price]", card)
      // Sin moneda todavía, el importe sigue en «—»: enseñar dólares a quien está en Bogotá y
      // que luego salten a pesos es peor que esperar un momento.
      const put = () => {
        node.textContent = cur ? price(perMonth(plan, interval, cur), cur) : "—"
        $("[data-per]", card).textContent = t(interval === "once" ? "pr.per.once" : plan === "team" ? "pr.per.team" : "pr.per")
        $("[data-fine]", card).textContent = interval === "once" ? t("pr.fine.once")
          : interval === "year" ? (cur ? t(plan === "team" ? "pr.fine.year.team" : "pr.fine.year", { total: price(amount(plan, "year", cur), cur) }) : "")
          : t("pr.fine.month")
      }
      if (animate && !reduced) { node.classList.add("is-swapping"); setTimeout(() => { put(); node.classList.remove("is-swapping") }, 200) } else put()
    })
    // Cada botón de empezar lleva su plan y el periodo de aquí. La moneda no viaja: la decide el
    // servidor con el mismo país.
    $$("a[data-plan-link]").forEach(a => {
      const plan = a.dataset.plan || "solo"
      const interval = PRICES[plan].once ? "once" : pricing.interval
      a.href = `${APP}/registro?plan=${plan}&interval=${interval}`
    })
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-interval]")
    if (!b || !b.closest("[data-plans]")) return
    pricing.interval = b.dataset.interval
    paintPrices()
  })
  visitorCurrency().then(cur => { pricing.currency = cur; paintPrices() })

  /* ── Preguntas: abren y cierran recorriendo su alto ── */
  function setupFaq() {
    let refresh
    $$(".faq details").forEach(d => {
      const s = $("summary", d), a = $(".faq__a", d)
      s.addEventListener("click", e => {
        e.preventDefault()
        if (d.open) {
          gsap.to(a, { height: 0, duration: .45, ease: "power3.inOut", onComplete: () => { d.open = false; a.style.height = "" } })
        } else {
          d.open = true
          gsap.fromTo(a, { height: 0 }, { height: "auto", duration: .6, ease: "expo.out", onComplete: () => { a.style.height = "" } })
        }
        clearTimeout(refresh)
        refresh = setTimeout(() => ScrollTrigger.refresh(), 700)
      })
    })
  }

  /* ── Lo que aparece al llegar ── */
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%", once: true,
    onEnter: els => els.forEach((n, i) => { n.style.setProperty("--delay", `${(i * .08).toFixed(2)}s`); n.classList.add("is-in") })
  })

  /* ── Botones que se acercan al puntero ──
     Todos, sin excepción: el relleno que sube y el imán son lo que hace que un botón se lea como
     de Beevo. Con unos sí y otros no, parecían de páginas distintas. Los de la demo no: son dibujo. */
  if (fine && !reduced) {
    $$("a.btn, button.btn").filter(b => !b.closest(".win")).forEach(b => {
      const xTo = gsap.quickTo(b, "x", { duration: .5, ease: "power3" })
      const yTo = gsap.quickTo(b, "y", { duration: .5, ease: "power3" })
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect()
        xTo(clamp((e.clientX - r.left - r.width / 2) * .22, -10, 10))
        yTo(clamp((e.clientY - r.top - r.height / 2) * .32, -8, 8))
      })
      b.addEventListener("pointerleave", () => { xTo(0); yTo(0) })
    })
  }

  /* ── La barra: sin fondo; se va al bajar y vuelve al subir ──
     Bajando se está leyendo y subiendo se busca algo: el logotipo y los botones aparecen justo
     entonces. El notch se queda siempre, que es el menú. */
  let lastY = 0
  function paintNav() {
    const y = scrollY
    if (Math.abs(y - lastY) < 6) return
    nav.classList.toggle("is-away", y > lastY && y > innerHeight * .2 && !pageNotch.has("is-menu"))
    lastY = y
  }
  addEventListener("scroll", paintNav, { passive: true })
  // Se crea en `boot`, después del pin del recorrido: medida antes, no contaría su alto de más.
  function setupDarkNav() {
    $$("[data-dark]").forEach(sec => ScrollTrigger.create({
      trigger: sec, start: () => `top ${nav.offsetHeight}`, end: () => `bottom ${nav.offsetHeight}`,
      onToggle: s => nav.classList.toggle("is-dark", s.isActive)
    }))
  }

  /* ── La demo se ve y se pausa ── */
  new IntersectionObserver(([e]) => {
    Demo.setPaused(!e.isIntersecting || e.intersectionRatio < .22 || document.hidden)
  }, { threshold: [0, .22, .5] }).observe($("[data-demo]"))
  document.addEventListener("visibilitychange", () => { if (document.hidden) Demo.setPaused(true) })

  /* ── Arranque ── */

  // El titular sube palabra a palabra, cada una por su ranura. Se parte después de poner el idioma.
  function wrapWords(node) {
    ;[...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return
          if (/^\s+$/.test(p)) return frag.append(" ")
          const o = document.createElement("span"), i = document.createElement("span")
          o.className = "wd"
          i.textContent = p
          o.append(i)
          frag.append(o)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1 && n.namespaceURI !== "http://www.w3.org/2000/svg" && !n.hasAttribute("data-swap")) wrapWords(n)
    })
  }

  /* ── Los titulares de sección entran palabra a palabra, cada una por su ranura, como el de la
     portada, y el trazo de marcador se dibuja detrás al final. ── */
  function setupRise() {
    if (reduced) return
    $$("[data-rise]").forEach(h => {
      wrapWords(h)
      const words = $$(".wd > span", h), hl = $(".hl", h)
      gsap.set(words, { yPercent: 112 })
      if (hl) gsap.set(hl, { "--hl": 0 })
      ScrollTrigger.create({
        trigger: h, start: "top 86%", once: true,
        onEnter: () => {
          gsap.to(words, { yPercent: 0, duration: 1.1, stagger: .055, ease: "expo.out" })
          if (hl) gsap.to(hl, { "--hl": 1, duration: .9, delay: .25 + words.length * .055, ease: "power3.inOut" })
        }
      })
    })
  }

  /* ── El porqué: las palabras se encienden al ritmo del scroll ──
     Nacen apagadas y se van llenando de tinta mientras se baja; el trazo de la cifra se dibuja cuando
     le llega su turno. Al subir se apagan otra vez. */
  function setupFill() {
    $$("[data-fill]").forEach(el => {
      if (reduced) return
      const split = node => [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment()
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return
            if (/^\s+$/.test(p)) return frag.append(" ")
            const w = document.createElement("span")
            w.className = "fw"
            w.textContent = p
            frag.append(w)
          })
          n.replaceWith(frag)
        } else if (n.nodeType === 1) split(n)
      })
      split(el)
      el.classList.add("is-filling")
      const words = $$(".fw", el), hl = $(".hl", el)
      const tl = gsap.timeline({ defaults: { ease: "none" } })
      words.forEach((w, i) => tl.to(w, { opacity: 1, duration: .5 }, i * .18))
      if (hl) {
        gsap.set(hl, { "--hl": 0 })
        const first = words.indexOf($(".fw", hl))
        tl.to(hl, { "--hl": 1, duration: 1.2 }, first * .18 + .2)
      }
      ScrollTrigger.create({ trigger: el, start: "top 80%", end: "bottom 42%", scrub: .5, animation: tl })
    })
  }

  /* ── Quien odia los CRM: la palabra del titular va cambiando ──
     Freelancers, agencias, creativos… sobre su trazo, como «Tu negocio» en la lista de espera. En el
     HTML va «freelancers», que es lo que lee el buscador. Con «menos movimiento» se queda quieta. */
  function setupWho() {
    const slot = $("[data-swap]")
    if (!slot) return
    const words = t("hero.who")
    let k = 0, timer = 0
    const put = (text, first) => {
      const old = $(".swap__in.is-on", slot)
      const next = document.createElement("span")
      next.className = first ? "swap__in is-on" : "swap__in"
      next.textContent = text
      if (first) slot.textContent = ""
      slot.appendChild(next)
      slot.style.width = `${next.getBoundingClientRect().width}px`
      if (first) return
      requestAnimationFrame(() => {
        next.classList.add("is-on")
        if (old) { old.classList.remove("is-on"); old.classList.add("is-out"); setTimeout(() => old.remove(), 900) }
      })
    }
    put(words[0], true)
    const fit = () => { const on = $(".swap__in.is-on", slot); if (on) slot.style.width = `${on.getBoundingClientRect().width}px` }
    addEventListener("resize", fit)
    if (reduced) return
    const run = () => {
      clearInterval(timer)
      if (document.hidden) return
      timer = setInterval(() => { k = (k + 1) % words.length; put(words[k]) }, 2400)
    }
    document.addEventListener("visibilitychange", run)
    setTimeout(run, 1800)
  }

  function intro() {
    document.body.classList.remove("is-loading")
    if (!reduced) wrapWords($("[data-hero-title]"))
    const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: reduced ? 0 : .35 })
    if (reduced) return
    // La cortina tarda un segundo en subir: lo de la portada nace detrás de ella, como en la lista.
    tl.from(".hero__title .wd > span", { yPercent: 112, duration: 1.3, stagger: .05 }, .45)
      .from(".hero__title [data-swap]", { y: 30, autoAlpha: 0, duration: 1.2 }, .6)
      .fromTo(".hero__title .hl", { "--hl": 0 }, { "--hl": 1, duration: 1, ease: "power3.inOut" }, 1.15)
      .from("[data-hero-in]", { y: 18, autoAlpha: 0, duration: 1, stagger: .09 }, .95)
  }

  /* ── La portada va cambiando de color, como la lista de espera ──
     Mientras se mira: al bajar, la página vuelve a la menta y se queda quieta para leer. */
  const THEMES = ["mint", "lilac", "lemon", "rose"]
  function setupThemes() {
    const hero = $("[data-hero]"), meta = $('meta[name="theme-color"]'), body = document.body
    let k = 0, timer = 0, inHero = true
    const set = name => {
      if (body.dataset.theme === name) return
      body.dataset.theme = name
      const hex = getComputedStyle(root).getPropertyValue(`--${name}`).trim()
      if (meta && hex) meta.setAttribute("content", hex)
    }
    function run() {
      clearInterval(timer)
      if (reduced || !inHero || document.hidden) return
      timer = setInterval(() => { k = (k + 1) % THEMES.length; set(THEMES[k]) }, 5200)
    }
    new IntersectionObserver(([e]) => {
      inHero = e.intersectionRatio > .4
      if (!inHero) { k = 0; set("mint") }
      run()
    }, { threshold: [0, .4, .7] }).observe(hero)
    document.addEventListener("visibilitychange", run)
  }

  /* ── El isotipo sigue al puntero ──
     Se desplaza y crece sobre lo que se pulsa; girarlo sería deformarlo, y el manual no deja. */
  function setupPointer() {
    if (!fine || reduced) return
    const cursor = $(".cursor")
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, dot = { ...p }
    addEventListener("pointermove", e => {
      p.x = e.clientX; p.y = e.clientY
      cursor.classList.add("is-on")
    }, { passive: true })
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"))
    document.addEventListener("pointerover", e => {
      const t = e.target
      cursor.classList.toggle("is-link", !!t.closest?.("a, button, summary, label, [data-tok]"))
      cursor.classList.toggle("is-dark", !!t.closest?.("[data-dark], .curtain"))
    })
    gsap.ticker.add(() => {
      dot.x = lerp(dot.x, p.x, .19)
      dot.y = lerp(dot.y, p.y, .19)
      cursor.style.transform = `translate(${dot.x}px, ${dot.y}px)`
    })
  }

  function boot() {
    applyLang()
    setupWho()
    intro()

    // El notch baja cuando la cortina ya se ha ido.
    setTimeout(dropNotch, reduced ? 0 : 1300)

    setupThemes()
    setupPointer()
    setupTour()
    paintPrices(false)
    setupDarkNav()
    setupRise()
    setupFill()
    setupSettle()
    setupOrbit()
    setupLineup()
    setupFaq()

    // Una sola vuelta por fotograma para lo que se mide en vivo.
    gsap.ticker.add(() => {
      const tr = tourEl.getBoundingClientRect()
      if (tr.top < innerHeight * 1.2 && tr.bottom > -innerHeight) updateFlight()
      look()
    })
    // Los pines se calculan de arriba abajo: cada uno empuja a los de debajo.
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
    paintNav()
    setTimeout(() => Demo.start(), reduced ? 0 : 800)
  }

  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]) : Promise.resolve()
  fontsReady.then(boot)
})()
