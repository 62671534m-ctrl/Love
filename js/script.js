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
  var btnVaciar = document.getElementById("btn-vaciar");
  var btnRincon = document.getElementById("btn-rincon");
  var btnSalir = document.getElementById("btn-salir");
  var btnInstalar = document.getElementById("btn-instalar");
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

  var yo = localStorage.getItem(CLAVE_USUARIO);
  var escuchando = false;
  var typingTimer = null;
  var tituloParpadeo = false;
  var db = null;
  var refMensajes = null;
  var refEscribiendo = null;
  var refBorrados = null;
  var refPrefs = null;
  var barraMensajes = null;
  var borradosCache = {};
  var prefsCache = {};
  var fotoSel = "";
  var fondoImgSel = "";
  var fondoOscuridadSel = 0;
  var emojisSel = true;
  var notificacionesOn = localStorage.getItem(CLAVE_NOTIF) !== "false";

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
    refBorrados = raiz.child("deleted");
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

  function acciones(key, m) {
    var wrap = document.createElement("span");
    wrap.className = "acciones";
    if (m.user === yo) {
      var bDel = document.createElement("button");
      bDel.type = "button";
      bDel.className = "del";
      bDel.title = "Borrar (solo para ti)";
      bDel.textContent = "🗑";
      bDel.setAttribute("aria-label", "Borrar mensaje");
      bDel.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!confirm("¿Borrar este mensaje solo para ti? La otra persona lo seguirá viendo.")) return;
        borrarMensaje(key, wrap.parentNode);
      });
      wrap.appendChild(bDel);
    }
    return wrap;
  }

  function hacerBurbuja(key, m) {
    var mia = m.user === yo;
    var burbuja = document.createElement("div");
    burbuja.className = "burbuja " + (mia ? "mia" : "suya");
    burbuja.dataset.key = key;
    burbuja.dataset.t = m.tiempo || 0;
    if (esSoloEmoji(m.texto)) burbuja.classList.add("emoji-mensaje");

    var texto = document.createElement("div");
    texto.className = "burbuja-texto";
    if (esSoloEmoji(m.texto)) {
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
    burbuja.appendChild(acciones(key, m));
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
    if (!m || !m.user || !m.texto) return;
    if (borradoParaMi(key, m)) return;
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
    var cerca = mensajesEl.scrollHeight - mensajesEl.scrollTop - mensajesEl.clientHeight < 160;
    if (cerca) mensajesEl.scrollTop = mensajesEl.scrollHeight;
  }

  /* ================= borrado solo para mí ================= */
  function borradoParaMi(key, m) {
    var me = borradosCache || {};
    if (me.__all && (m.tiempo || 0) <= +me.__all) return true;
    if (me[key]) return true;
    return false;
  }

  function borrarMensaje(key, nodo) {
    if (!refBorrados) return;
    refBorrados.child(yo).child(key).set(true);
    if (nodo && nodo.parentNode) nodo.parentNode.removeChild(nodo);
    vacioSiAplica();
  }

  function observarBorrados() {
    refBorrados.child(yo).on("value", function (snap) {
      borradosCache = snap.val() || {};
      aplicarBorrados();
    });
  }

  function aplicarBorrados() {
    if (!barraMensajes) return;
    var me = borradosCache || {};
    barraMensajes.querySelectorAll("[data-key]").forEach(function (n) {
      var k = n.getAttribute("data-key");
      var t = +(n.getAttribute("data-t") || 0);
      if (me.__all && t <= +me.__all) n.remove();
      else if (me[k]) n.remove();
    });
    vacioSiAplica();
  }

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
        body: (m.texto || "").slice(0, 160),
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
        toast("💌 " + m.user + ": " + (esSoloEmoji(m.texto) ? m.texto : m.texto.slice(0, 80)));
        if (notificacionesOn && (document.hidden || !document.hasFocus())) notificar(m);
        if (document.hidden) titular("💌 " + m.user + " te escribió");
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
    if (!pickerEl.classList.contains("hidden") && !audioCtx) asegurarAudio();
  });

  document.addEventListener("click", function (e) {
    if (!pickerEl.classList.contains("hidden") &&
        !pickerEl.contains(e.target) && e.target !== btnEmoji) {
      pickerEl.classList.add("hidden");
    }
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
      emojis: emojisSel
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

  /* ================= vaciar chat ================= */
  btnVaciar.addEventListener("click", function () {
    if (!yo || !refBorrados) return;
    if (!confirm("¿Vaciar el chat solo para ti? La otra persona seguirá viendo todos los mensajes. 💔")) return;
    var ahora = Date.now();
    refBorrados.child(yo).child("__all").set(ahora);
    borradosCache.__all = ahora;
    aplicarBorrados();
    toast("Chat vaciado para ti 🧹");
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
      observarBorrados();
      encenderListener();
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
    if (refBorrados && yo) refBorrados.child(yo).off();
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