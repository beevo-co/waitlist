/* El embudo de la landing: qué se mira, hasta dónde se baja y qué se pulsa. Lo recibe la app
   (`POST app.beevo.co/embudo`, `FunnelEventsController`) y se mira en su admin, en «Landing».

   **Sin cookies ni nada guardado en el navegador**, así que no hay banner que pedir: quién es quién
   lo decide el servidor con una huella de la IP y el navegador que cambia cada día (`FunnelEvent`).
   Como el registro vive en el mismo servidor, la huella casa la visita con el registro sin pasar
   nada por la URL.

   Se manda con `sendBeacon` en texto plano: no pide permiso antes (`OPTIONS`) y llega aunque la
   página se esté cerrando o se vaya a otra —justo al pulsar «Empezar»—. Si algo falla, se calla:
   contar no puede romper la página. */
(() => {
  const host = location.hostname
  const ENDPOINT = /(^|\.)beevo\.co$/.test(host) ? "https://app.beevo.co/embudo"
    : /^(localhost|127\.0\.0\.1)$/.test(host) ? "http://localhost:3000/embudo"
      : null // una vista previa de Vercel no cuenta
  if (!ENDPOINT || !navigator.sendBeacon) return

  const query = new URLSearchParams(location.search)
  const utm = {
    source: query.get("utm_source") || query.get("ref") || (query.has("fbclid") ? "facebook" : query.has("gclid") ? "google-ads" : null),
    medium: query.get("utm_medium"),
    campaign: query.get("utm_campaign")
  }
  const queue = []
  const push = (n, p = {}) => { queue.push({ n, p }) }

  function flush() {
    if (!queue.length) return
    const body = JSON.stringify({ events: queue.splice(0), path: location.pathname, ref: document.referrer, utm })
    try { navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" })) } catch { /* se calla */ }
  }

  push("pageview")

  /* Las secciones. Cuenta cuando se ve un tercio de ella —o media pantalla, en las que miden más
     que la pantalla, como la del porqué—, una vez por visita. */
  const sections = [...document.querySelectorAll("main > section")]
  const seen = new Set()
  const sectionId = el => el.id || (el.matches("[data-hero]") ? "top" : null)
  const reached = new Set()
  function look() {
    const vh = innerHeight
    for (const el of sections) {
      const id = sectionId(el)
      if (!id || seen.has(id)) continue
      const r = el.getBoundingClientRect()
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0)
      if (visible > 0 && visible >= Math.min(r.height / 3, vh / 2)) { seen.add(id); push("section", { section: id }) }
    }
    const doc = document.documentElement
    const pct = ((scrollY + vh) / Math.max(doc.scrollHeight, 1)) * 100
    for (const depth of [25, 50, 75, 100]) {
      if (!reached.has(depth) && pct >= (depth === 100 ? 98 : depth)) { reached.add(depth); push("scroll", { depth }) }
    }
  }
  let ticking = false
  addEventListener("scroll", () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => { ticking = false; look() })
  }, { passive: true })
  addEventListener("load", () => setTimeout(look, 600))

  /* Qué se pulsa, y desde dónde: la sección, la barra, el notch o el pie. */
  const where = el => {
    if (el.closest(".nav")) return "nav"
    if (el.closest("[data-page-notch]")) return "notch"
    if (el.closest(".foot")) return "foot"
    const section = el.closest("main > section")
    return section ? sectionId(section) : null
  }
  document.addEventListener("click", e => {
    const el = e.target.closest?.("a, button, summary")
    if (!el) return
    const href = el.getAttribute("href") || ""
    let event = null
    if (href.includes("/registro")) {
      const plan = new URL(el.href, location.href).searchParams
      event = { target: "signup", label: where(el), plan: plan.get("plan"), interval: plan.get("interval") }
    } else if (href.includes("/acceder")) event = { target: "login", label: where(el) }
    else if (href === "#precios") event = { target: "pricing", label: where(el) }
    else if (href.includes("/soporte")) event = { target: "support", label: where(el) }
    else if (el.matches("[data-interval]")) event = { target: "interval", label: el.dataset.interval }
    else if (el.matches("[data-notch-toggle]")) event = { target: "nav", label: "notch" }
    else if (el.matches("summary") && el.closest("#preguntas")) {
      if (el.parentElement.open) return // cerrarla no dice nada
      event = { target: "faq", label: el.querySelector("[data-i18n]")?.dataset.i18n }
    }
    if (!event) return
    push("click", event)
    // Si se va de la página, que salga ya.
    if (event.target === "signup" || event.target === "login" || event.target === "support") flush()
  }, true)

  /* Cuánto tiempo se tuvo la página delante: solo con la pestaña a la vista. */
  let shown = 0, since = document.visibilityState === "visible" ? Date.now() : null
  const engaged = () => shown + (since ? Date.now() - since : 0)
  function leave() {
    const seconds = Math.round(engaged() / 1000)
    if (seconds > 0) push("engaged", { seconds })
    flush()
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (since) { shown += Date.now() - since; since = null }
      leave()
    } else since = Date.now()
  })
  addEventListener("pagehide", leave)
  setInterval(flush, 5000)
  setTimeout(flush, 1500)
})()
