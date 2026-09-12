var CACHE = "el-rincon-v3";
var PRECACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/config.js",
  "./js/script.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).catch(function () { }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || !req.url || new URL(req.url).origin !== self.location.origin) return;
  var destino = req.destination || "";
  var clave = new URL(req.url);
  clave.search = "";

  if (destino === "document" || destino === "") {
    e.respondWith(fetch(req).then(function (resp) {
      var copia = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(clave, copia); });
      return resp;
    }).catch(function () {
      return caches.match(clave).then(function (hit) { return hit || caches.match("./index.html"); });
    }));
    return;
  }

  e.respondWith(caches.match(clave).then(function (hit) {
    var red = fetch(req).then(function (resp) {
      if (resp && resp.ok) {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(clave, copia); });
      }
      return resp;
    }).catch(function () { return hit; });
    return hit || red;
  }));
});

function pushLog(cuerpo) {
  return new Promise(function (res) {
    try {
      var open = indexedDB.open("mg-push-log", 1);
      open.onupgradeneeded = function () { open.result.createObjectStore("logs", { keyPath: "id", autoIncrement: true }); };
      open.onsuccess = function () {
        var db = open.result;
        var tx = db.transaction("logs", "readwrite");
        var st = tx.objectStore("logs");
        st.put({ body: String(cuerpo || ""), t: Date.now() });
        tx.oncomplete = function () { db.close(); res(); };
        tx.onerror = function () { try { db.close(); } catch (e) { } res(); };
      };
      open.onerror = function () { res(); };
    } catch (e) { res(); }
  });
}

self.addEventListener("push", function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = {}; }
  var titulo = data.title || "💌 Nuevo mensaje";
  var opciones = {
    body: data.body || "Tienes un mensaje en el rincón 💕",
    tag: "mg-rincon",
    data: { url: data.url || "index.html" }
  };
  e.waitUntil(Promise.all([
    pushLog(opciones.body),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (pestañas) {
      pestañas.forEach(function (c) {
        try { c.postMessage({ type: "mg-push", payload: data }); } catch (err) { }
      });
      var alFrente = pestañas.some(function (c) { return c.focused; });
      if (!alFrente) return self.registration.showNotification(titulo, opciones);
    })
  ]));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "index.html";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (lista) {
    for (var i = 0; i < lista.length; i++) {
      if (new URL(lista[i].url).origin === self.location.origin) {
        return lista[i].navigate(url).then(function (c) { return c.focus(); });
      }
    }
    return self.clients.openWindow(url);
  }));
});