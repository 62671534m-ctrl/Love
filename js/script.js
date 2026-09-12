/* ============ MAYKOOL & GABRIELA — el rincón de los dos ============ */
(function () {
  "use strict";

  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NOMBRES_VALIDOS = { maykool: "Maykool", gabriela: "Gabriela" };
  var EMOJIS = ["💖", "❤️", "😘", "💋", "😍", "🥰", "😊", "🥺",
                "🌹", "💘", "🎀", "🌸", "💕", "😻", "✨", "🤍"];
  var CLAVE_USUARIO = "mg-usuario";
  var CLAVE_PREFS = "mg-prefs-";
  var CLAVE_NOTIF = "mg-notif";
  var TITULO = "Maykool 💘 Gabriela";

  /* ---------- referencias al DOM ---------- */
  var loginEl = document.getElementById("login");
  var chatEl = document.getElementById("chat");
  var formEl = document.getElementById("login-form");
  var inputNombre = document.getElementById("login-nombre");
  var errorEl = document.getElementById("login-error");
  var notaEl = document.getElementById("login-nota");
  var mantoEl = document.getElementById("fondo-manto");
  var tintaEl = document.getElementById("fondo-tinta");
  var fondoEl = document.getElementById("fondo");
  var mensajesEl = document.getElementById("mensajes");
  var estadoEl = document.getElementById("estado");
  var inputTexto = document.getElementById("input-texto");
  var btnEnviar = document.getElementById("btn-enviar");
  var btnEmoji = document.getElementById("btn-emoji");
  var pickerEl = document.getElementById("emoji-picker");
  var btnRincon = document.getElementById("btn-rincon");
  var btnSalir = document.getElementById("btn-salir");
  var btnInstalar = document.getElementById("btn-instalar");
  var btnMedia = document.getElementById("btn-media");
  var mediaPicker = document.getElementById("media-picker");
  var btnMediaFoto = document.getElementById("media-foto");
  var btnMediaVideo = document.getElementById("media-video");
  var btnMediaAudio = document.getElementById("media-audio");
  var mediaFotoInput = document.getElementById("media-foto-input");
  var mediaVideoInput = document.getElementById("media-video-input");
  var grabandoEl = document.getElementById("media-grabando");
  var grabandoTiempo = document.getElementById("grabando-tiempo");
  var btnGrabarParar = document.getElementById("grabar-parar");
  var btnGrabarCancelar = document.getElementById("grabar-cancelar");
  var btnIrUltimo = document.getElementById("btn-ir-ultimo");
  var modalPreview = document.getElementById("modal-preview");
  var previewTitulo = document.getElementById("preview-titulo");
  var previewContenido = document.getElementById("preview-contenido");
  var btnPreviewEnviar = document.getElementById("btn-preview-enviar");
  var btnPreviewCancelar = document.getElementById("btn-preview-cancelar");
  var toastsEl = document.getElementById("toasts");

  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("sw.js").then(function (reg) { swReg = reg; }).catch(function () { });
  }

  var modalRincon = document.getElementById("modal-rincon");
  var rinconFotoPreview = document.getElementById("rincon-foto-preview");
  var btnRinconFoto = document.getElementById("btn-rincon-foto");
  var btnRinconFotoQuitar = document.getElementById("btn-rincon-foto-quitar");
  var rinconFotoInput = document.getElementById("rincon-foto-input");
  var rinconFondoPreview = document.getElementById("rincon-fondo-preview");
  var btnRinconFondo = document.getElementById("btn-rincon-fondo");
  var btnRinconFondoQuitar = document.getElementById("btn-rincon-fondo-quitar");
  var rinconFondoInput = document.getElementById("rincon-fondo-input");
  var rinconOscuridad = document.getElementById("rincon-fondo-oscuridad");
  var rinconOscuridadValor = document.getElementById("rincon-fondo-valor");
  var rinconCorazones = document.getElementById("rincon-corazones");
  var rinconNotif = document.getElementById("rincon-notif");
  var btnGuardarRincon = document.getElementById("btn-guardar-rincon");
  var btnCerrarRincon = document.getElementById("btn-cerrar-rincon");
  var btnTemas = document.getElementById("btn-temas");
  var modalTemas = document.getElementById("modal-temas");
  var grillaTemas = document.getElementById("temas-grilla");
  var buscadorTemas = document.getElementById("temas-buscador");
  var btnCerrarTemas = document.getElementById("btn-cerrar-temas");

  var yo = localStorage.getItem(CLAVE_USUARIO);
  var escuchando = false;
  var typingTimer = null;
  var tituloParpadeo = false;
  var db = null;
  var refMensajes = null;
  var refEscribiendo = null;
  var refPrefs = null;
  var barraMensajes = null;
  var prefsCache = {};
  var fotoSel = "";
  var fondoImgSel = "";
  var fondoOscuridadSel = 0;
  var emojisSel = true;
  var notificacionesOn = localStorage.getItem(CLAVE_NOTIF) !== "false";
  var temaSel = "";

  /* ================= fondo de corazones flotantes ================= */
  function crearFondo(cantidad) {
    if (reducir || fondoEl.childElementCount) return;
    var simbolos = ["💗", "💕", "💖", "🤍", "🌸", "✨", "💞"];
    for (var i = 0; i < cantidad; i++) {
      var c = document.createElement("span");
      c.className = "corazon-fondo";
      c.textContent = simbolos[i % simbolos.length];
      c.style.left = Math.random() * 96 + "vw";
      c.style.fontSize = 12 + Math.random() * 24 + "px";
      c.style.animationDuration = 9 + Math.random() * 12 + "s";
      c.style.animationDelay = -Math.random() * 16 + "s";
      c.style.setProperty("--va", (Math.random() * 60 - 30).toFixed(0) + "px");
      c.style.setProperty("--op", (0.2 + Math.random() * 0.35).toFixed(2));
      fondoEl.appendChild(c);
    }
  }
  crearFondo(window.innerWidth < 500 ? 14 : 20);

  /* ================= sonidos (Web Audio API) ================= */
  var audioCtx = null;

  function asegurarAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function tono(frec, duracion, volumen, retraso) {
    if (!audioCtx) return;
    setTimeout(function () {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = frec;
      gain.gain.setValueAtTime(volumen, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracion);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duracion);
    }, retraso || 0);
  }

  function sonidoEnviar() {
    asegurarAudio();
    tono(620, 0.16, 0.18);
    tono(420, 0.18, 0.12, 0.08);
  }

  function sonidoRecibir() {
    asegurarAudio();
    tono(880, 0.18, 0.14);
    tono(1318, 0.22, 0.12, 0.12);
  }

  /* ================= utilidades ================= */
  function horaBonita(ms) {
    try {
      return new Date(ms).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* -------- utilidades de color para temas -------- */
  function hexRGB(h) {
    if (!/^#[0-9a-f]{3}$/i.test(h) && !/^#[0-9a-f]{6}$/i.test(h)) h = "#ffffff";
    if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  function mezcla(a, b, p) {
    var ca = hexRGB(a), cb = hexRGB(b);
    return "#" + [0, 1, 2].map(function (i) {
      return Math.round(ca[i] + (cb[i] - ca[i]) * p).toString(16).padStart(2, "0");
    }).join("");
  }

  function esOscuro(hex) {
    var c = hexRGB(hex);
    return (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) < 128;
  }

  /* -------- resúmenes para notificaciones -------- */
  function mediaResumen(m) {
    if (m && m.media && m.media.tipo) {
      return m.media.tipo === "foto" ? "📷 Foto" : m.media.tipo === "video" ? "🎥 Video" : m.media.tipo === "audio" ? "🎤 Audio" : "📎 Archivo";
    }
    return null;
  }
  function cuerpoCorto(m) {
    return mediaResumen(m) || (m && m.texto ? m.texto.slice(0, 160) : "");
  }

  function esSoloEmoji(texto) {
    var t = texto.trim().replace(/\s+/g, "");
    if (!t) return false;
    return /^\p{Extended_Pictographic}(\uFE0F|\u200D)*$/u.test(t);
  }

  function estaConfigurado() {
    var cfg = window.FIREBASE_CONFIG;
    return cfg && cfg.apiKey && cfg.databaseURL && window.SECRET_CODE;
  }

  function canonicalizar(nombre) {
    return NOMBRES_VALIDOS[nombre.trim().toLowerCase()] || null;
  }

  function elOtro() {
    return yo === "Maykool" ? "Gabriela" : "Maykool";
  }

  function mostrarLogin() {
    loginEl.hidden = false;
    loginEl.classList.remove("hidden");
    chatEl.hidden = true;
    chatEl.classList.add("hidden");
    chatEl.setAttribute("aria-hidden", "true");
    inputNombre.focus();
  }

  function mostrarChat() {
    loginEl.hidden = true;
    loginEl.classList.add("hidden");
    chatEl.hidden = false;
    chatEl.classList.remove("hidden");
    chatEl.removeAttribute("aria-hidden");
    setTimeout(function () { inputTexto.focus(); }, 80);
  }

  /* ================= toasts ================= */
  function toast(msg, malo) {
    if (!toastsEl) return;
    var t = document.createElement("div");
    t.className = "toast" + (malo ? " malo" : "");
    t.textContent = msg;
    toastsEl.appendChild(t);
    setTimeout(function () {
      t.classList.add("sale");
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 2600);
  }

  /* ================= corazón que vuela al enviar ================= */
  function corazonVuela(desdeEl) {
    if (reducir) return;
    var r = desdeEl.getBoundingClientRect();
    var c = document.createElement("span");
    c.className = "corazon-enviado";
    c.textContent = ["💖", "💕", "💘", "✨"][Math.floor(Math.random() * 4)];
    c.style.setProperty("--x", r.left + r.width / 2 + "px");
    c.style.setProperty("--y", r.top + "px");
    c.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
    document.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 1300);
  }

  /* ================= estado: escribiendo ================= */
  function estadoEscribiendo(quien) {
    estadoEl.innerHTML = esc(quien) + " está escribiendo <span class='estado-punto'></span>";
  }

  function estadoConectados() {
    estadoEl.innerHTML = "Conectad@s <span class='estado-punto'></span>";
  }

  /* ================= prefijos, foto y fondo ================= */
  function archivoAUrl(file, maxLado, calidad, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var r = Math.min(1, maxLado / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * r));
      var h = Math.max(1, Math.round(img.height * r));
      var cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#FFF7FA";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      cb(cv.toDataURL("image/jpeg", calidad));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  function misPrefs() {
    return prefsCache[yo] || {};
  }

  function avatarUrl(nombre) {
    var p = prefsCache[nombre] || {};
    return (p.foto && typeof p.foto === "string" && p.foto.indexOf("data:") === 0) ? p.foto : null;
  }

  function pintarAvatar(nombre) {
    var av = document.getElementById("avatar-" + nombre.toLowerCase());
    if (!av) return;
    var foto = avatarUrl(nombre);
    if (foto) {
      av.innerHTML = "<img src='" + foto + "' alt=''>";
      av.classList.add("avatar-foto");
    } else {
      av.innerHTML = nombre.charAt(0);
      av.classList.remove("avatar-foto");
    }
  }

  function aplicarPrefsVista(p) {
    p = p || {};
    if (p.tema) {
      var t = temaPorNombre(p.tema);
      if (t) { temaSel = p.tema; aplicarTema(t); }
    }
    var tieneImg = !!(p.fondoImg && typeof p.fondoImg === "string" && p.fondoImg.indexOf("data:") === 0);
    mantoEl.style.backgroundImage = tieneImg ? "url(" + p.fondoImg + ")" : "none";
    mantoEl.classList.toggle("on", tieneImg);
    document.documentElement.setAttribute("data-fondo-img", tieneImg ? "1" : "");
    tintaEl.style.opacity = (parseInt(p.fondoOscuridad, 10) || 0) / 100;
    fondoEl.style.display = (p.emojis === false) ? "none" : "";
  }

  function pintarVistaFotoModal() {
    if (fotoSel) {
      rinconFotoPreview.innerHTML = "<img src='" + fotoSel + "' alt=''>";
      rinconFotoPreview.classList.add("avatar-foto");
    } else {
      rinconFotoPreview.innerHTML = yo ? yo.charAt(0) : "😊";
      rinconFotoPreview.classList.remove("avatar-foto");
    }
  }

  function pintarVistaFondoModal() {
    if (fondoImgSel) {
      rinconFondoPreview.innerHTML = "<img src='" + fondoImgSel + "' alt=''>";
    } else {
      rinconFondoPreview.innerHTML = "🌸";
    }
  }

  function centralRincon() {
    rinconOscuridad.value = fondoOscuridadSel;
    rinconOscuridadValor.textContent = fondoOscuridadSel + "%";
    rinconCorazones.checked = emojisSel;
    rinconNotif.checked = notificacionesOn;
  }

  function leerPrefs() {
    var clave = CLAVE_PREFS + yo;
    var local = null;
    try { local = JSON.parse(localStorage.getItem(clave) || "null"); } catch (e) { /* no importa */ }
    if (local && typeof local === "object") {
      prefsCache[yo] = local;
      aplicarPrefsVista(local);
      pintarAvatar(yo);
    }
    refPrefs.child(yo).on("value", function (snap) {
      var p = snap.val() || {};
      prefsCache[yo] = p;
      try { localStorage.setItem(clave, JSON.stringify(p)); } catch (e) { /* sin espacio */ }
      aplicarPrefsVista(p);
      pintarAvatar(yo);
    });
    refPrefs.child(elOtro()).on("value", function (snap) {
      prefsCache[elOtro()] = snap.val() || {};
      pintarAvatar(elOtro());
    });
  }

  /* ================= Firebase: arranque ================= */
  function arrancarFirebase(despues) {
    if (!estaConfigurado()) { if (despues) despues(false); return; }
    if (db) { if (despues) despues(true); return; }

    firebase.initializeApp(window.FIREBASE_CONFIG);
    db = firebase.database();
    var raiz = db.ref("c/" + window.SECRET_CODE);
    refMensajes = raiz.child("messages");
    refEscribiendo = raiz.child("typing");
    refPrefs = raiz.child("users");
    refPush = raiz.child("push");

    firebase.auth().signInAnonymously()
      .then(function () { if (despues) despues(true); })
      .catch(function () { if (despues) despues(false); });
  }

  /* ================= dibujo de mensajes ================= */
  function linkificar(t) {
    var s = esc(t);
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/(^|\s)(www\.[^\s<]+)/g, '$1<a href="https://$2" target="_blank" rel="noopener noreferrer">$2</a>');
    return s;
  }

  function hacerBurbuja(key, m) {
    var mia = m.user === yo;
    var burbuja = document.createElement("div");
    burbuja.className = "burbuja " + (mia ? "mia" : "suya");
    burbuja.dataset.key = key;
    burbuja.dataset.t = m.tiempo || 0;
    if (m.media && m.media.tipo && m.media.data) burbuja.classList.add("media-mensaje", "media-" + m.media.tipo);

    var texto = document.createElement("div");
    texto.className = "burbuja-texto";
    if (m.media && m.media.tipo && m.media.data) {
      texto.className = "media-marco";
      var src = esc(m.media.data);
      if (m.media.tipo === "foto") {
        texto.innerHTML = "<img class='media-foto' src='" + src + "' alt='Foto 💕'>";
      } else if (m.media.tipo === "video") {
        texto.innerHTML = "<video class='media-video' src='" + src + "' controls preload='metadata'></video>";
      } else if (m.media.tipo === "audio") {
        texto.innerHTML = "<audio class='media-audio' src='" + src + "' controls preload='metadata'></audio>";
      } else {
        texto.innerHTML = "";
      }
    } else if (esSoloEmoji(m.texto)) {
      texto.textContent = m.texto;
    } else {
      texto.innerHTML = linkificar(m.texto);
    }

    var hora = document.createElement("time");
    hora.className = "burbuja-hora";
    hora.dateTime = new Date(m.tiempo || Date.now()).toISOString();
    hora.textContent = (mia ? "Yo · " : m.user + " · ") + horaBonita(m.tiempo || Date.now());

    burbuja.appendChild(texto);
    burbuja.appendChild(hora);
    return burbuja;
  }

  function crearBarraMensajes() {
    barraMensajes = document.createElement("div");
    barraMensajes.className = "barra";
    mensajesEl.innerHTML = "";
    mensajesEl.appendChild(barraMensajes);

    var vacio = document.createElement("div");
    vacio.className = "vacio";
    vacio.innerHTML = "<span class='vacio-emoji'>💌</span>Empieza el chat<br>envíale algo bonito a " +
      elOtro() + " 💕";
    barraMensajes.appendChild(vacio);
  }

  function agregarMensaje(key, m) {
    if (!m || !m.user) return;
    if (!m.texto && !(m.media && m.media.tipo && m.media.data)) return;
    if (document.querySelector('[data-key="' + key + '"]')) return;
    if (!barraMensajes) crearBarraMensajes();

    var vacio = barraMensajes.querySelector(".vacio");
    if (vacio) vacio.remove();

    barraMensajes.appendChild(hacerBurbuja(key, m));
    abajoSiCerca();
  }

  function vacioSiAplica() {
    if (!barraMensajes) return;
    if (barraMensajes.querySelector("[data-key]")) return;
    if (!barraMensajes.querySelector(".vacio")) {
      var v = document.createElement("div");
      v.className = "vacio";
      v.innerHTML = "<span class='vacio-emoji'>💌</span>Empieza el chat<br>envíale algo bonito a " +
        elOtro() + " 💕";
      barraMensajes.appendChild(v);
    }
  }

  function abajoSiCerca() {
    if (cercaDelFinal()) mensajesEl.scrollTop = mensajesEl.scrollHeight;
    actualizarBotonAbajo();
  }

  function cercaDelFinal() {
    return mensajesEl.scrollHeight - mensajesEl.scrollTop - mensajesEl.clientHeight < 200;
  }

  function actualizarBotonAbajo() {
    if (!btnIrUltimo) return;
    btnIrUltimo.classList.toggle("hidden", cercaDelFinal());
  }

  function irAlUltimo(suave) {
    if (!mensajesEl) return;
    if (suave) {
      mensajesEl.scrollTo({ top: mensajesEl.scrollHeight, behavior: "smooth" });
    } else {
      mensajesEl.style.scrollBehavior = "auto";
      mensajesEl.scrollTop = mensajesEl.scrollHeight;
      setTimeout(function () { mensajesEl.style.scrollBehavior = ""; }, 60);
    }
    actualizarBotonAbajo();
  }

  btnIrUltimo.addEventListener("click", function () { irAlUltimo(true); });
  mensajesEl.addEventListener("scroll", actualizarBotonAbajo, { passive: true });

  /* ================= notificaciones ================= */
  function pedirPermisoNotif() {
    if (typeof Notification === "undefined") {
      toast("Tu navegador no soporta notificaciones 💔", true);
      return;
    }
    if (Notification.permission === "granted") {
      registrarPush();
      return;
    }
    Notification.requestPermission().then(function (perm) {
      if (perm === "granted") { toast("Notificaciones activadas 🔔"); registrarPush(); }
      else {
        toast("Bloqueaste las notificaciones en el navegador 💔", true);
        notificacionesOn = false;
        localStorage.setItem(CLAVE_NOTIF, "0");
        if (rinconNotif) rinconNotif.checked = false;
      }
    });
  }

  function notificar(m) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    try {
      var foto = avatarUrl(m.user);
      var n = new Notification("💌 " + m.user, {
        body: cuerpoCorto(m),
        icon: foto || undefined,
        tag: "mg-rincon"
      });
      setTimeout(function () { n.close(); }, 5000);
    } catch (e) { /* sin notificación */ }
  }

  /* ================= push nativo (web push) ================= */
  var refPush = null;
  var swReg = null;

  async function registrarPush() {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    try {
      if (!swReg) swReg = await navigator.serviceWorker.register("sw.js");
      if (!swReg.active) {
        var activo = swReg.installing || swReg.waiting;
        await new Promise(function (res) {
          if (swReg.active) return res();
          if (!activo) return res();
          activo.addEventListener("statechange", function () { if (swReg.active) res(); });
          setTimeout(res, 8000);
        });
      }
      var sub = await swReg.pushManager.getSubscription();
      if (!sub) sub = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: window.VAPID_PUBLIC });
      if (!sub) return false;
      if (refPush && yo) {
        var json = sub.toJSON();
        await refPush.child(yo).set({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          at: Date.now()
        });
      }
      return true;
    } catch (e) {
      console.warn("push:", e && e.name, e && e.message);
      return false;
    }
  }

  /* ================= escuchar mensajes nuevos ================= */
  function encenderListener() {
    if (escuchando || !refMensajes) return;
    escuchando = true;

    refMensajes.on("child_added", function (snap) {
      var m = snap.val();
      agregarMensaje(snap.key, m);
      if (m && m.user !== yo) {
        sonidoRecibir();
        toast("💌 " + m.user + ": " + cuerpoCorto(m));
        if (notificacionesOn && (document.hidden || !document.hasFocus())) notificar(m);
        if (document.hidden) titular("💌 " + m.user + " te envió " + (mediaResumen(m) || "un mensaje"));
      }
    });

    refEscribiendo.on("value", function (snap) {
      var quien = snap.val();
      if (quien && quien !== yo) estadoEscribiendo(quien);
      else estadoConectados();
    });
  }

  /* ================= título que parpadea ================= */
  function titular(texto) {
    tituloParpadeo = true;
    document.title = texto;
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { tituloParpadeo = false; document.title = TITULO; }
  });

  setInterval(function () {
    if (tituloParpadeo && document.hidden) {
      document.title = document.title === "💌 Nuevo mensaje" ? TITULO : "💌 Nuevo mensaje";
    }
  }, 1200);

  /* ================= enviar mensaje ================= */
  function enviar() {
    var texto = inputTexto.value.trim();
    if (!texto || !yo || !refMensajes) return;
    asegurarAudio();

    refMensajes.push({ user: yo, texto: texto, tiempo: Date.now() }).then(function () {
      inputTexto.value = "";
      estadoConectados();
    });

    sonidoEnviar();
    corazonVuela(btnEnviar);
    abajoSiCerca();
  }

  /* ---------- indicador de escritura ---------- */
  inputTexto.addEventListener("input", function () {
    if (!yo || !refEscribiendo) return;
    clearTimeout(typingTimer);
    refEscribiendo.set(yo);
    typingTimer = setTimeout(function () { refEscribiendo.remove(); }, 1500);
  });

  btnEnviar.addEventListener("click", enviar);
  inputTexto.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  });

  /* ================= selector de emojis ================= */
  EMOJIS.forEach(function (em) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = em;
    b.setAttribute("aria-label", "Añadir " + em);
    b.addEventListener("click", function () {
      inputTexto.value += em;
      inputTexto.focus();
      pickerEl.classList.add("hidden");
    });
    pickerEl.appendChild(b);
  });

  btnEmoji.addEventListener("click", function () {
    pickerEl.classList.toggle("hidden");
    mediaPicker.classList.add("hidden");
    if (!pickerEl.classList.contains("hidden") && !audioCtx) asegurarAudio();
  });

  document.addEventListener("click", function (e) {
    if (!pickerEl.classList.contains("hidden") &&
        !pickerEl.contains(e.target) && e.target !== btnEmoji && e.target !== btnMedia) {
      pickerEl.classList.add("hidden");
    }
    if (!mediaPicker.classList.contains("hidden") &&
        !mediaPicker.contains(e.target) && e.target !== btnMedia && e.target !== btnEmoji) {
      mediaPicker.classList.add("hidden");
    }
  });

  /* ================= enviar foto, video y audio ================= */
  function fotoDataURL(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var r = Math.min(1, 1400 / Math.max(img.width, img.height));
      var w = Math.max(1, Math.round(img.width * r));
      var h = Math.max(1, Math.round(img.height * r));
      var cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { cb(cv.toDataURL("image/jpeg", 0.85)); } catch (e) { cb(null); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  function leerDataURL(blob, cb) {
    var r = new FileReader();
    r.onload = function () { cb(r.result); };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(blob);
  }

  function enviarMedia(media) {
    if (!yo || !refMensajes || !media || !media.tipo || !media.data || !media.data.length) return;
    asegurarAudio();
    refMensajes.push({ user: yo, tiempo: Date.now(), media: { tipo: media.tipo, data: media.data } }).then(function () {
      estadoConectados();
    });
    sonidoEnviar();
    corazonVuela(btnEnviar);
    abajoSiCerca();
  }

  var MEDIA_MAX_FOTO = 3.5 * 1024 * 1024;
  var MEDIA_MAX_VIDEO = 6 * 1024 * 1024;
  var MEDIA_MAX_AUDIO = 8 * 1024 * 1024;

  /* ---------- vista previa antes de enviar (como WhatsApp) ---------- */
  var pendienteMedia = null;

  function mostrarPreview(media) {
    if (!media || !media.tipo || !media.data) return;
    pendienteMedia = media;
    var etiqueta = media.tipo === "foto" ? "esta foto" : media.tipo === "video" ? "este video" : "este audio";
    previewTitulo.textContent = "¿Enviar " + etiqueta + "?";
    previewContenido.innerHTML = "";
    var src = esc(media.data);
    if (media.tipo === "foto") {
      previewContenido.innerHTML = "<img src='" + src + "' alt='Vista previa de la foto a enviar'>";
    } else if (media.tipo === "video") {
      previewContenido.innerHTML = "<video src='" + src + "' controls preload='metadata'></video>";
    } else if (media.tipo === "audio") {
      previewContenido.innerHTML = "<audio src='" + src + "' controls></audio>";
    }
    if (!audioCtx) asegurarAudio();
    modalPreview.classList.remove("hidden");
  }

  function cerrarPreview() {
    modalPreview.classList.add("hidden");
    pendienteMedia = null;
    previewContenido.innerHTML = "";
  }

  btnPreviewEnviar.addEventListener("click", function () {
    if (!pendienteMedia) return;
    enviarMedia(pendienteMedia);
    cerrarPreview();
  });

  btnPreviewCancelar.addEventListener("click", cerrarPreview);
  modalPreview.addEventListener("click", function (e) {
    if (e.target === modalPreview) cerrarPreview();
  });

  btnMedia.addEventListener("click", function () {
    if (!yo) return;
    mediaPicker.classList.toggle("hidden");
    pickerEl.classList.add("hidden");
    if (!mediaPicker.classList.contains("hidden") && !audioCtx) asegurarAudio();
  });

  btnMediaFoto.addEventListener("click", function () {
    mediaPicker.classList.add("hidden");
    mediaFotoInput.click();
  });

  btnMediaVideo.addEventListener("click", function () {
    mediaPicker.classList.add("hidden");
    mediaVideoInput.click();
  });

  btnMediaAudio.addEventListener("click", function () {
    mediaPicker.classList.add("hidden");
    iniciarGrabacion();
  });

  mediaFotoInput.addEventListener("change", function () {
    var f = mediaFotoInput.files && mediaFotoInput.files[0];
    if (!f) return;
    fotoDataURL(f, function (data) {
      if (!data) { toast("No pude leer esa foto 😢", true); return; }
      if (data.length > MEDIA_MAX_FOTO * 1.35) { toast("Esa foto es demasiado pesada 💔", true); return; }
      mostrarPreview({ tipo: "foto", data: data });
    });
    mediaFotoInput.value = "";
  });

  mediaVideoInput.addEventListener("change", function () {
    var f = mediaVideoInput.files && mediaVideoInput.files[0];
    if (!f) return;
    if (f.size > MEDIA_MAX_VIDEO) { toast("El video es muy pesado (máx 6 MB) 💔", true); return; }
    leerDataURL(f, function (data) {
      if (!data) { toast("No pude leer ese video 😢", true); return; }
      mostrarPreview({ tipo: "video", data: data });
    });
    mediaVideoInput.value = "";
  });

  /* ---------- grabación de audio ---------- */
  var grabador = null;
  var grabadoraStream = null;
  var grabaTrozos = [];
  var grabaIntervalo = null;

  function ocultarGrabando() {
    if (grabaIntervalo) { clearInterval(grabaIntervalo); grabaIntervalo = null; }
    grabandoEl.classList.add("hidden");
  }

  function iniciarGrabacion() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      toast("Tu navegador no puede grabar audio 🎤", true);
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      grabadoraStream = stream;
      grabador = new MediaRecorder(stream);
      grabaTrozos = [];
      grabador.ondataavailable = function (ev) { if (ev.data && ev.data.size) grabaTrozos.push(ev.data); };
      grabador.onstop = function () {
        if (grabadoraStream) { grabadoraStream.getTracks().forEach(function (t) { t.stop(); }); grabadoraStream = null; }
        ocultarGrabando();
        if (!grabaTrozos.length) { toast("No se grabó nada 🎤"); return; }
        var blob = new Blob(grabaTrozos, { type: grabador.mimeType || "audio/webm" });
        if (blob.size > MEDIA_MAX_AUDIO) { toast("El audio es demasiado largo 💔", true); return; }
        leerDataURL(blob, function (data) {
          if (data) mostrarPreview({ tipo: "audio", data: data });
          else toast("No pude enviar el audio 😢", true);
        });
      };
      grabador.start();
      grabandoEl.classList.remove("hidden");
      grabandoTiempo.textContent = "0:00";
      var secs = 0;
      grabaIntervalo = setInterval(function () {
        secs++;
        grabandoTiempo.textContent = Math.floor(secs / 60) + ":" + (secs % 60 < 10 ? "0" : "") + (secs % 60);
        if (secs >= 60) pararGrabacion();
      }, 1000);
    }).catch(function () {
      toast("Sin permiso para el micrófono 🎤", true);
    });
  }

  function pararGrabacion() {
    if (grabador && grabador.state !== "inactive") { try { grabador.stop(); } catch (e) { } }
  }

  function cancelarGrabacion() {
    if (grabador) {
      grabador.onstop = null;
      try { if (grabador.state !== "inactive") grabador.stop(); } catch (e) { }
      grabador = null;
    }
    if (grabadoraStream) { grabadoraStream.getTracks().forEach(function (t) { t.stop(); }); grabadoraStream = null; }
    ocultarGrabando();
    toast("Grabación cancelada 🎤");
  }

  btnGrabarParar.addEventListener("click", pararGrabacion);
  btnGrabarCancelar.addEventListener("click", cancelarGrabacion);

  /* ================= 100 temas personalizados ================= */
  function temaPorNombre(nombre) {
    if (!window.TEMAS) return null;
    for (var i = 0; i < TEMAS.length; i++) if (TEMAS[i].n === nombre) return TEMAS[i];
    return null;
  }

  function aplicarTema(t) {
    if (!t) return;
    var r = document.documentElement.style;
    var superf = esOscuro(t.f1);
    r.setProperty("--f1", t.f1);
    r.setProperty("--f2", t.f2);
    r.setProperty("--corazon-fondo", mezcla(t.ac, "#ffffff", 0.35));
    r.setProperty("--rosa-50", t.f1);
    r.setProperty("--rosa-100", t.f2);
    r.setProperty("--rosa-200", mezcla(t.ac, "#ffffff", 0.78));
    r.setProperty("--rosa-300", mezcla(t.ac, "#ffffff", 0.60));
    r.setProperty("--rosa-400", mezcla(t.ac, "#ffffff", 0.25));
    r.setProperty("--rosa-500", mezcla(t.ac, "#ffffff", 0.10));
    r.setProperty("--rosa-600", t.ac);
    r.setProperty("--rosa-700", mezcla(t.ac, "#000000", 0.25));
    r.setProperty("--lavanda-100", t.f2);
    r.setProperty("--lavanda-200", mezcla(t.f2, "#ffffff", 0.55));
    r.setProperty("--tinta", t.tx);
    r.setProperty("--tinta-suave", t.tx2);
    r.setProperty("--my1", mezcla(t.my, "#ffffff", 0.20));
    r.setProperty("--my2", mezcla(t.my, "#000000", 0.16));
    r.setProperty("--myt", t.myt);
    r.setProperty("--ot1", mezcla(t.ot, "#ffffff", 0.10));
    r.setProperty("--ot2", mezcla(t.ot, "#000000", 0.04));
    r.setProperty("--ott", t.ott);
    r.setProperty("--superficie", superf ? "rgba(30, 22, 38, .82)" : "rgba(255, 255, 255, .92)");
    r.setProperty("--superficie-ob", superf ? "#2a2136" : "#ffffff");
  }

  function elegirTema(nombre) {
    var t = temaPorNombre(nombre);
    if (!t) return;
    temaSel = nombre;
    aplicarTema(t);
    var p = misPrefs() || {};
    p.tema = nombre;
    prefsCache[yo] = p;
    try { localStorage.setItem(CLAVE_PREFS + yo, JSON.stringify(p)); } catch (e) { /* sin espacio */ }
    if (refPrefs && yo) refPrefs.child(yo).update({ tema: nombre }).catch(function () { });
    pintarTemasGrilla(buscadorTemas ? buscadorTemas.value : "");
  }

  function pintarTemasGrilla(filtro) {
    if (!grillaTemas || !window.TEMAS) return;
    grillaTemas.innerHTML = "";
    var f = (filtro || "").trim().toLowerCase();
    var lis = TEMAS;
    if (f) lis = TEMAS.filter(function (t) { return (t.n + " " + t.e).toLowerCase().indexOf(f) !== -1; });
    if (!lis.length) {
      var nada = document.createElement("div");
      nada.className = "temas-nada";
      nada.textContent = "No encontré ese tema 💔";
      grillaTemas.appendChild(nada);
      return;
    }
    lis.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tema-tarjeta" + (t.n === temaSel ? " elegido" : "");
      b.setAttribute("aria-label", "Tema " + t.n);
      var m = document.createElement("span");
      m.className = "tema-muestra";
      m.style.background = "linear-gradient(135deg, " + t.f1 + ", " + t.f2 + ")";
      var nm = document.createElement("span");
      nm.textContent = t.e + " " + t.n;
      b.appendChild(m);
      b.appendChild(nm);
      if (t.n === temaSel) {
        var tick = document.createElement("span");
        tick.className = "tema-tick";
        tick.textContent = "✓";
        b.appendChild(tick);
      }
      b.addEventListener("click", (function (nn) { return function () { elegirTema(nn); }; })(t.n));
      grillaTemas.appendChild(b);
    });
  }

  function abrirTemas() {
    if (!yo) return;
    pintarTemasGrilla(buscadorTemas ? buscadorTemas.value : "");
    modalTemas.classList.remove("hidden");
  }

  function cerrarTemas() {
    modalTemas.classList.add("hidden");
  }

  if (btnTemas) btnTemas.addEventListener("click", abrirTemas);
  if (btnCerrarTemas) btnCerrarTemas.addEventListener("click", cerrarTemas);
  if (modalTemas) modalTemas.addEventListener("click", function (e) {
    if (e.target === modalTemas) cerrarTemas();
  });
  if (buscadorTemas) buscadorTemas.addEventListener("input", function () {
    pintarTemasGrilla(this.value);
  });

  /* ================= tu rincón: foto, fondo y notificaciones ================= */
  function abrirRincon() {
    if (!yo) return;
    var p = misPrefs();
    fotoSel = p.foto || "";
    fondoImgSel = p.fondoImg || "";
    fondoOscuridadSel = parseInt(p.fondoOscuridad, 10) || 0;
    emojisSel = p.emojis !== false;
    pintarVistaFotoModal();
    pintarVistaFondoModal();
    centralRincon();
    modalRincon.classList.remove("hidden");
    asegurarAudio();
  }

  function cerrarRincon() {
    modalRincon.classList.add("hidden");
  }

  function guardarRincon() {
    var datos = {
      foto: fotoSel,
      fondoImg: fondoImgSel,
      fondoOscuridad: fondoOscuridadSel,
      emojis: emojisSel,
      tema: temaSel || (prefsCache[yo] || {}).tema || ""
    };
    prefsCache[yo] = datos;
    try { localStorage.setItem(CLAVE_PREFS + yo, JSON.stringify(datos)); } catch (e) { /* sin espacio */ }
    if (refPrefs) refPrefs.child(yo).set(datos);
    aplicarPrefsVista(datos);
    pintarAvatar(yo);
    cerrarRincon();
    toast("Tu rinconcito quedó guardado ✨");
  }

  btnRincon.addEventListener("click", abrirRincon);
  btnCerrarRincon.addEventListener("click", cerrarRincon);
  btnGuardarRincon.addEventListener("click", guardarRincon);

  modalRincon.addEventListener("click", function (e) {
    if (e.target === modalRincon) cerrarRincon();
  });

  btnRinconFoto.addEventListener("click", function () { rinconFotoInput.click(); });
  btnRinconFotoQuitar.addEventListener("click", function () {
    fotoSel = "";
    pintarVistaFotoModal();
  });

  btnRinconFondo.addEventListener("click", function () { rinconFondoInput.click(); });
  btnRinconFondoQuitar.addEventListener("click", function () {
    fondoImgSel = "";
    pintarVistaFondoModal();
    aplicarPrefsVista({ fondoImg: "", fondoOscuridad: fondoOscuridadSel, emojis: emojisSel });
  });

  rinconFotoInput.addEventListener("change", function () {
    var f = rinconFotoInput.files && rinconFotoInput.files[0];
    if (!f) return;
    archivoAUrl(f, 800, 0.85, function (data) {
      if (!data) { toast("No pude leer esa imagen 😢", true); return; }
      fotoSel = data;
      pintarVistaFotoModal();
    });
    rinconFotoInput.value = "";
  });

  rinconFondoInput.addEventListener("change", function () {
    var f = rinconFondoInput.files && rinconFondoInput.files[0];
    if (!f) return;
    archivoAUrl(f, 1600, 0.82, function (data) {
      if (!data) { toast("No pude leer esa imagen 😢", true); return; }
      fondoImgSel = data;
      pintarVistaFondoModal();
      aplicarPrefsVista({ fondoImg: fondoImgSel, fondoOscuridad: fondoOscuridadSel, emojis: emojisSel });
    });
    rinconFondoInput.value = "";
  });

  rinconOscuridad.addEventListener("input", function () {
    fondoOscuridadSel = +rinconOscuridad.value || 0;
    rinconOscuridadValor.textContent = fondoOscuridadSel + "%";
    aplicarPrefsVista({ fondoImg: fondoImgSel, fondoOscuridad: fondoOscuridadSel, emojis: emojisSel });
  });

  rinconCorazones.addEventListener("change", function () {
    emojisSel = rinconCorazones.checked;
    aplicarPrefsVista({ fondoImg: fondoImgSel, fondoOscuridad: fondoOscuridadSel, emojis: emojisSel });
  });

  rinconNotif.addEventListener("change", function () {
    notificacionesOn = rinconNotif.checked;
    localStorage.setItem(CLAVE_NOTIF, notificacionesOn ? "1" : "0");
    if (notificacionesOn) {
      pedirPermisoNotif();
    } else if (refPush && yo) {
      refPush.child(yo).remove().catch(function () { });
    }
  });

  /* ================= entrar al chat ================= */
  function entrar(nombre) {
    yo = canonicalizar(nombre);
    localStorage.setItem(CLAVE_USUARIO, yo);
    estadoConectados();
    mostrarChat();

    arrancarFirebase(function (ok) {
      if (!ok) return;
      leerPrefs();
      pintarAvatar("Maykool");
      pintarAvatar("Gabriela");
      crearBarraMensajes();
      encenderListener();
      if (refMensajes) {
        refMensajes.once("value", function () {
          irAlUltimo(false);
          var reajuste = 0;
          function reajustarAlFondo() {
            reajuste++;
            if (reajuste > 6) return;
            irAlUltimo(false);
          }
          mensajesEl.addEventListener("load", reajustarAlFondo, true);
          setTimeout(reajustarAlFondo, 900);
          setTimeout(reajustarAlFondo, 2000);
          setTimeout(function () { mensajesEl.removeEventListener("load", reajustarAlFondo, true); }, 3500);
        });
      }
      abajoSiCerca();
      if (notificacionesOn) registrarPush();
    });
  }

  /* ================= instalación como app (PWA) ================= */
  var instalacionDiferida = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    instalacionDiferida = e;
    window.__mgPromptFired = true;
    btnInstalar.classList.remove("hidden");
  });

  btnInstalar.addEventListener("click", function () {
    if (instalacionDiferida) {
      instalacionDiferida.prompt();
      instalacionDiferida.userChoice.then(function () {
        instalacionDiferida = null;
        btnInstalar.classList.add("hidden");
      });
      return;
    }
    var esIOs = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (esIOs && !window.matchMedia("(display-mode: standalone)").matches) {
      toast("📲 En tu iPhone: Compartir → «Agregar a pantalla de inicio»");
    } else {
      toast("📲 En el menú del navegador, «Instalar El Rincón» 💕");
    }
  });

  window.addEventListener("appinstalled", function () {
    btnInstalar.classList.add("hidden");
  });

  /* ================= formulario de login ================= */
  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    var nombre = inputNombre.value.trim();
    if (!nombre) return;

    var canon = canonicalizar(nombre);
    if (!canon) {
      errorEl.hidden = false;
      errorEl.textContent = "Hmm... este rincón es solo para Maykool y Gabriela 💔";
      var tarjeta = document.querySelector(".login-tarjeta");
      tarjeta.style.animation = "none";
      void tarjeta.offsetWidth;
      tarjeta.style.animation = "sacudida .45s ease";
      return;
    }

    if (!estaConfigurado()) {
      errorEl.hidden = true;
      notaEl.hidden = false;
      notaEl.textContent = "💡 Hola " + canon + "!\n" +
        "Falta conectar Firebase: sigue los pasos de DESIGN.md\n" +
        "y pega tus claves en js/config.js 💕";
      return;
    }

    errorEl.hidden = true;
    notaEl.hidden = true;
    entrar(canon);
  });

  /* ================= cerrar sesión ================= */
  btnSalir.addEventListener("click", function () {
    if (escuchando && refMensajes) {
      refMensajes.off();
      refEscribiendo.off();
      escuchando = false;
    }
    if (refPrefs) {
      refPrefs.child(yo).off();
      refPrefs.child(elOtro()).off();
    }
    yo = null;
    barraMensajes = null;
    mensajesEl.innerHTML = "";
    estadoConectados();
    document.title = TITULO;
    tituloParpadeo = false;
    localStorage.removeItem(CLAVE_USUARIO);
    inputNombre.value = "";
    mostrarLogin();
  });

  window.addEventListener("focus", function () {
    tituloParpadeo = false;
    document.title = TITULO;
  });

  /* ================= arranque: sesión guardada ================= */
  if (yo && canonicalizar(yo)) {
    entrar(yo);
  } else {
    yo = null;
    localStorage.removeItem(CLAVE_USUARIO);
    mostrarLogin();
  }
})();